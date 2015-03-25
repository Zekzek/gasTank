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
	$scope.player[BOTTOM] = {'name':'Bottom', 'ai':'Computer', 'color':'#0000A0', 'time':5, 'order':'2nd' };
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
		if ($scope.player[$scope.turn].ai == 'Computer') {
			$scope.getBestMove(1, $scope.turn, [], $scope.player[TOP].time);
		}
	}
	
	$scope.displayValidMovesFor = function(piece) {
		$scope.validMoves = getValidMovesFor($scope.playBoard, piece);
	}
	
	$scope.displayMove = function(move) {
		$scope.validMoves = move;
	}
	
	$scope.calcMove = function() {
		//console.debug($scope.displayMove.human);
		moveAsIndexList = [
			$scope.convertLabelToIndex($scope.displayMove.human.charAt(0), $scope.columnLabels),
			$scope.convertLabelToIndex($scope.displayMove.human.charAt(1), $scope.rowLabels),
			$scope.convertLabelToIndex($scope.displayMove.human.charAt(2), $scope.columnLabels),
			$scope.convertLabelToIndex($scope.displayMove.human.charAt(3), $scope.rowLabels)
		];
		
		if (moveAsIndexList[0] && moveAsIndexList[1]) {
			$scope.setStartPos({'x':+moveAsIndexList[0], 'y':+moveAsIndexList[1]});
			if (moveAsIndexList[2] && moveAsIndexList[3]) {
				$scope.setEndPos({'x':+moveAsIndexList[2], 'y':+moveAsIndexList[3]});
			}
		}
	}
	
	$scope.convertLabelToIndex = function(label, labels) {
		for (var i in labels) {
			if (labels[i].toLowerCase() == label.toLowerCase()) {
				return i;
			}
		}
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
					$scope.displayMove.human = 
						$scope.columnLabels[$scope.humanMove[0].x]
						+ $scope.rowLabels[$scope.humanMove[0].y]
						+ $scope.columnLabels[$scope.humanMove[1].x]
						+ $scope.rowLabels[$scope.humanMove[1].y]
					console.debug(JSON.stringify($scope.humanMove));
					$scope.displayMove($scope.humanMove);
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
	
	$scope.getBestMove = function(depth, isPlayer, historicalMoves, time) {
		$scope.thinking = true;
		if (time) {
			setTimeout(function() {
				$scope.killWorkers();
				$scope.$apply();
			}, time * 1000);
		}
		var childBoards = getChildBoards($scope.playBoard, isPlayer);
		if (!$scope.bestMove) {
			$scope.bestMove = childBoards[0].move;
		}
		$scope.bestValue = Number.NEGATIVE_INFINITY;
		$scope.depth = depth;
		historicalMoves.unshift({});
		var bestMove = null;
		$scope.workers = [];
		for (var i in childBoards) {		
			var move = childBoards[i].move;
			if (!$scope.moveList[i]) {
				$scope.moveList[i] = childBoards[i].move;
			}
			$scope.workers[i] = new Worker('negamaxWorker.js');
			$scope.workers[i].postMessage([childBoards[i], depth - 1, -isPlayer, historicalMoves, i]);
			$scope.workers[i].onmessage = function(msg) {
				this.terminate();
				var workerIndex = $scope.workers.indexOf(this);
				$scope.workers.splice(workerIndex, 1);
				if (msg.data.value > $scope.bestValue) {
					$scope.bestValue = msg.data.value;
					bestMove = childBoards[msg.data.index].move;
					bestMove.score = msg.data.value;
				}
				if ($scope.workers.length == 0) {
					$scope.bestMove = bestMove;
					$scope.displayMove($scope.bestMove);
					$scope.$apply();
					if (depth < 30) {
						$scope.getBestMove(depth + 1, isPlayer, historicalMoves);
					}
					else {
						$scope.thinking = false;
					}
				}
			}
		}
	}
	
	$scope.killWorkers = function() {
		for (var i in $scope.workers) {
			$scope.workers[i].terminate();
		}
		$scope.workers = [];
		$scope.thinking = false;
	}
	
	$scope.makeMove = function(move) {
		if (!move[0].symbol) {
			move[0] = getAtPos($scope.playBoard, move[0]);
		}
		makeMove($scope.playBoard, move[0], move[1]);
		$scope.displayMove.human = "";
		$scope.turn *= -1;
		$scope.checkForLoss();
		$scope.humanMove[0] = null;
		$scope.humanMove[1] = null;
		$scope.clearBestMove();
		if ($scope.player[$scope.turn].ai == 'Computer') {
			$scope.getBestMove(1, $scope.turn, [], $scope.player[TOP].time);
		}
	}
	
	$scope.checkForLoss = function() {
		if (checkForLoss($scope.playBoard, $scope.turn)) {
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