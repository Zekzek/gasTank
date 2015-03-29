var gasTankApp = angular.module('gasTankApp', []);

gasTankApp.controller('gasTankCtrl', function($scope, $http, BottomPieces, TopPieces) {
	
	$scope.TOP = -1;
	$scope.BOTTOM = 1;
	
	$scope.squareSize = 175;
	$scope.borderSize = 25;
	$scope.columnLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
	$scope.rowLabels = ['7', '6', '5', '4', '3', '2', '1'];
	$scope.aiSettings = ['Human', 'Computer'];
	$scope.personas = ['Dive', 'Threat'];
	$scope.orderOptions = ['1st', '2nd'];
	$scope.gasColor = ['#000', '#C20', '#9C0', '#0C0'];
	
	$scope.phase = 'setup';
	
	$scope.validMoves = [];
	$scope.humanMove = [];
	$scope.validMove = null;
	$scope.moveList = [];
	
	$scope.player = {};
	$scope.player[TOP] = {'name':'Threat', 'ai':'Computer', 'color':'#A00000', 'time':5, 'order':'1st' };
	$scope.player[BOTTOM] = {'name':'Dive', 'ai':'Computer', 'color':'#0000A0', 'time':5, 'order':'2nd' };
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
			$scope.getBestMove([], $scope.player[$scope.turn].name, $scope.player[$scope.turn].time);
		}
	}
	
	$scope.displayValidMovesFor = function(piece) {
		$scope.validMoves = getValidMovesFor($scope.playBoard, piece);
	}
	
	$scope.displayMove = function(move) {
		$scope.validMoves = move;
	}
	
	$scope.calcMove = function() {
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
	
	$scope.getBestMove = function(historicalMoves, name, time) {
		$scope.thinking = true;
		
		$scope.worker = new Worker('negamaxWorker.js');
		$scope.worker.postMessage([$scope.playBoard, $scope.turn, historicalMoves, name, time]);
		$scope.worker.onmessage = function(msg) {
			$scope.bestMove = msg.data.bestMove;
			$scope.depth = msg.data.depth;
			$scope.bestMove.score = msg.data.score;
			$scope.displayMove($scope.bestMove);
			if (msg.data.done) {
				$scope.thinking = false;
			}
			$scope.$apply();
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
		move[0] = getAtPos($scope.playBoard, move[0]);
		makeMove($scope.playBoard, move[0], move[1]);
		$scope.displayMove.human = "";
		$scope.turn *= -1;
		$scope.checkForLoss();
		$scope.humanMove[0] = null;
		$scope.humanMove[1] = null;
		$scope.clearBestMove();
		if ($scope.player[$scope.turn].ai == 'Computer') {
			$scope.getBestMove([], $scope.player[$scope.turn].name, $scope.player[$scope.turn].time);
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
			'x': 3,
			'y': 5,
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
			'x': 5,
			'y': 5,
			'gas': 3
		}
	];
	return pieces;
});

gasTankApp.factory('TopPieces', function() {
	var pieces = [
		{
			'symbol': 'N',
			'x': 3,
			'y': 1,
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
			'x': 5,
			'y': 1,
			'gas': 3
		}
	];
	return pieces;
});