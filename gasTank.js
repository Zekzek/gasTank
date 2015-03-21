var gasTankApp = angular.module('gasTankApp', []);

gasTankApp.controller('gasTankCtrl', function($scope, $http, BottomPieces, TopPieces) {
	
	$scope.TOP = -1;
	$scope.BOTTOM = 1;
	
	$scope.squareSize = 175;
	$scope.borderSize = 25;
	$scope.columnLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
	$scope.rowLabels = ['7', '6', '5', '4', '3', '2', '1'];
	$scope.aiSettings = ['Human', 'Computer'];
	$scope.orderOptions = ['1st', '2nd'];
	$scope.gasColor = ['#000', '#C20', '#9C0', '#0C0'];
	
	$scope.phase = 'setup';
	
	$scope.validMoves = [];
	$scope.humanMove = [];
	$scope.validMove = null;
	$scope.moveList = [];
	
	$scope.player = {};
	$scope.player[TOP] = {'name':'Top', 'ai':'Computer', 'color':'#A00000', 'time':5, 'order':'1st' };
	$scope.player[BOTTOM] = {'name':'Bottom', 'ai':'Human', 'color':'#0000A0', 'time':5, 'order':'2nd' };
	$scope.turn;
	$scope.workers = [];
	$scope.thinking = false;
	
	$scope.playBoard = {};
	$scope.playBoard.pieces = {};
	$scope.playBoard.pieces[BOTTOM] = JSON.parse(JSON.stringify(BottomPieces));
	$scope.playBoard.pieces[TOP] = JSON.parse(JSON.stringify(TopPieces));
	
	$scope.startGame = function() {
		$scope.phase = 'game';
		if ($scope.player[TOP].order == '1st') {
			$scope.turn = TOP;
		}
		else {
			$scope.turn = BOTTOM;
		}
	}
	
	/*
		DISPLAY METHODS
	*/
	$scope.displayValidMovesFor = function(piece) {
		$scope.validMoves = getValidMovesFor($scope.playBoard, piece);
	}
	
	$scope.setStartPos = function(item) {
		$scope.humanMove[0] = {'x':item.x, 'y':item.y};
		$scope.humanMove[1] = null;
		$scope.validMove = null;
		var piece = getAtPos($scope.playBoard, $scope.humanMove[0]);
		if (piece) {
			$scope.displayValidMovesFor(piece);
		}
	}
	
	$scope.setEndPos = function(item) {
		if ($scope.humanMove[0]) {
			var piece = getAtPos($scope.playBoard, $scope.humanMove[0]);
			if (piece) {
				if ($scope.humanMove[0].x != item.x || $scope.humanMove[0].y != item.y) {
					$scope.humanMove[1] = {'x':item.x, 'y':item.y};
					// if moving an enemy piece, invalidate move
					for (var i in $scope.playBoard.pieces[-$scope.turn]) {
						if ($scope.playBoard.pieces[-$scope.turn][i] == piece) {
							$scope.validMove = false;
							return;
						}
					}
					$scope.validMove = isValidMove($scope.playBoard, piece, $scope.humanMove[1]); 
				}
				else {
					$scope.humanMove[0] = null;
				}
			}
		}
	}
	
	$scope.toggleOrder = function(player) {
		if (player.order == '1st') {
			player.order = '2nd';
		}
		else {
			player.order = '1st';
		}
	}
	
	$scope.clearValidMoves = function() {
		$scope.validMoves = null;
		$scope.validMove = null;
	}
	
	$scope.convertPos = function(item) {
		return { 'column':$scope.columnLabels[item.x], 'row':$scope.rowLabels[item.y] };
	}
	
	$scope.getBestMove = function(depth, isPlayer, time) {
		$scope.thinking = true;
		if (time) {
			setTimeout(function() {
				$scope.killWorkers();
				$scope.$apply();
			}, time * 1000);
		}
		var childBoards = getChildBoards($scope.playBoard, isPlayer);
		$scope.moveCount = childBoards.length;
		console.debug("childBoards.length: " + childBoards.length);
		$scope.movesRecieved = 0;
		$scope.bestValue = Number.NEGATIVE_INFINITY;
		var bestMove = null;
		$scope.workers = [];
		for (var i in childBoards) {		
			var move = childBoards[i].move;
			if (!$scope.moveList[i]) {
				$scope.moveList[i] = childBoards[i].move;
			}
			var negamaxWorker = new Worker('negamaxWorker.js');
			negamaxWorker.postMessage([childBoards[i], depth - 1, -isPlayer, i]);
			negamaxWorker.onmessage = function(msg) {
				console.debug("getBestMove received: " + JSON.stringify(msg.data));
				$scope.movesRecieved++;
				$scope.moveList[msg.data.index].score = msg.data.value;
				$scope.moveList[msg.data.index].moves = msg.data.moves;
				if (msg.data.value > $scope.bestValue) {
					$scope.bestValue = msg.data.value;
					$scope.bestMove = childBoards[msg.data.index].move;
				}
				$scope.$apply();
				if ($scope.movesRecieved == $scope.moveCount) {
					if (depth < 30) {
						$scope.getBestMove(depth + 1, isPlayer);
					}
					else {
						$scope.thinking = false;
					}
				}
			}
			$scope.workers.push(negamaxWorker);
		}
	}
	
	$scope.killWorkers = function() {
		for (var i in $scope.workers) {
			$scope.workers[i].terminate();
		}
		$scope.workers = [];
		$scope.thinking = false;
	}
	
	$scope.makeMove = function(board, move) {
		if (!move[0].symbol) {
			move[0] = getAtPos(board, move[0]);
		}
		makeMove(board, move[0], move[1]);
		$scope.turn *= -1;
		$scope.checkForWin();
		$scope.humanMove[0] = null;
		$scope.humanMove[1] = null;
		$scope.clearBestMove();
	}
	
	$scope.checkForWin = function() {
		var hasKing = false;
		var hasMoves = false;
		for (var i in $scope.playBoard.pieces[$scope.turn]) {
			if ($scope.playBoard.pieces[$scope.turn][i].symbol == 'K') {
				hasKing = true;
			}
			if (!hasMoves && getValidMovesFor($scope.playBoard, $scope.playBoard.pieces[$scope.turn][i]).length > 0) {
				hasMoves = true;
			}
		}
		if (!hasKing || !hasMoves) {
			$scope.phase = 'win';
			$scope.winner = $scope.player[-$scope.turn];
		}
	}
	
	$scope.reset = function() {
		$scope.playBoard.pieces[BOTTOM] = JSON.parse(JSON.stringify(BottomPieces));
		$scope.playBoard.pieces[TOP] = JSON.parse(JSON.stringify(TopPieces));
		$scope.phase = 'setup';
	}
	
	$scope.clearBestMove = function() {
		$scope.bestMove = null;
		$scope.moveList = [];
	}
});
  
gasTankApp.factory('BottomPieces', function() {
	var pieces = [
		{
			'symbol': 'N',
			'x': 1,
			'y': 6,
			'gas': 3
		},
		{
			'symbol': 'B',
			'x': 2,
			'y': 6,
			'gas': 3
		},
		{
			'symbol': 'Q',
			'x': 3,
			'y': 6,
			'gas': 3
		},
		{
			'symbol': 'K',
			'x': 4,
			'y': 6,
			'gas': 3
		},
		{
			'symbol': 'B',
			'x': 5,
			'y': 6,
			'gas': 3
		},
		{
			'symbol': 'N',
			'x': 6,
			'y': 6,
			'gas': 3
		}
	];
	return pieces;
});

gasTankApp.factory('TopPieces', function() {
	var pieces = [
		{
			'symbol': 'N',
			'x': 1,
			'y': 0,
			'gas': 3
		},
		{
			'symbol': 'B',
			'x': 2,
			'y': 0,
			'gas': 3
		},
		{
			'symbol': 'Q',
			'x': 3,
			'y': 0,
			'gas': 3
		},
		{
			'symbol': 'K',
			'x': 4,
			'y': 0,
			'gas': 3
		},
		{
			'symbol': 'B',
			'x': 5,
			'y': 0,
			'gas': 3
		},
		{
			'symbol': 'N',
			'x': 6,
			'y': 0,
			'gas': 3
		}
	];
	return pieces;
});