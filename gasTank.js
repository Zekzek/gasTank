var gasTankApp = angular.module('gasTankApp', []);

gasTankApp.controller('gasTankCtrl', function($scope, $http, HumanPieces, ComputerPieces) {
	$scope.squareSize = 80;
	$scope.borderSize = 20;
	$scope.columnLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
	$scope.rowLabels = ['7', '6', '5', '4', '3', '2', '1'];
	
	$scope.humanPieces = HumanPieces;
	$scope.computerPieces = ComputerPieces;
	
	$scope.displayValidMovesFor = function(piece) {
		$scope.validMoves = $scope.getValidMovesFor(piece);
	}
	
	$scope.onBoard = function(move) {
		return move.x >= 0 && move.x < $scope.columnLabels.length
			&& move.y >= 0 && move.y < $scope.rowLabels.length;
	}
	
	$scope.addIfOnBoard = function(list, move) {
		if ($scope.onBoard(move)) {
			list.push(move);
			return true;
		}
		return false;
	}
	
	$scope.getAtPos = function(x, y) {
		for (var i in $scope.humanPieces) {
			if ($scope.humanPieces[i].x == x && $scope.humanPieces[i].y == y) {
				return $scope.humanPieces[i];
			}
		}
		for (var i in $scope.computerPieces) {
			if ($scope.computerPieces[i].x == x && $scope.computerPieces[i].y == y) {
				return $scope.computerPieces[i];
			}
		}
	}
	
	$scope.getValidMovesFor = function(piece) {
		var validMoves = [];
		if (piece.symbol == 'N' || piece.symbol == 'Q') {
			$scope.addIfOnBoard(validMoves, {x:(piece.x + 1), y:(piece.y + 2)});
			$scope.addIfOnBoard(validMoves, {x:(piece.x + 1), y:(piece.y - 2)});
			$scope.addIfOnBoard(validMoves, {x:(piece.x - 1), y:(piece.y + 2)});
			$scope.addIfOnBoard(validMoves, {x:(piece.x - 1), y:(piece.y - 2)});
			$scope.addIfOnBoard(validMoves, {x:(piece.x + 2), y:(piece.y + 1)});
			$scope.addIfOnBoard(validMoves, {x:(piece.x + 2), y:(piece.y - 1)});
			$scope.addIfOnBoard(validMoves, {x:(piece.x - 2), y:(piece.y + 1)});
			$scope.addIfOnBoard(validMoves, {x:(piece.x - 2), y:(piece.y - 1)});
		}
		if (piece.symbol == 'B' || piece.symbol == 'Q') {
			var x = 1;
			var y = 1;
			while($scope.addIfOnBoard(validMoves, {x:(piece.x + x), y:(piece.y + y)}) && !$scope.getAtPos(x, y)) {
				x++;
				y++;
			}
			x = 1;
			y = -1;
			while($scope.addIfOnBoard(validMoves, {x:(piece.x + x), y:(piece.y + y)}) && !$scope.getAtPos(x, y)) {
				x++;
				y--;
			}
			x = -1;
			y = -1;
			while($scope.addIfOnBoard(validMoves, {x:(piece.x + x), y:(piece.y + y)}) && !$scope.getAtPos(x, y)) {
				x--;
				y--;
			}
			x = -1;
			y = 1;
			while($scope.addIfOnBoard(validMoves, {x:(piece.x + x), y:(piece.y + y)}) && !$scope.getAtPos(x, y)) {
				x--;
				y++;
			}
		}
		else if (piece.symbol == 'K') {
			$scope.addIfOnBoard(validMoves, {x:(piece.x - 1), y:(piece.y + 1)});
			$scope.addIfOnBoard(validMoves, {x:(piece.x), y:(piece.y + 1)});
			$scope.addIfOnBoard(validMoves, {x:(piece.x + 1), y:(piece.y + 1)});
			$scope.addIfOnBoard(validMoves, {x:(piece.x - 1), y:(piece.y)});
			$scope.addIfOnBoard(validMoves, {x:(piece.x + 1), y:(piece.y)});
			$scope.addIfOnBoard(validMoves, {x:(piece.x - 1), y:(piece.y - 1)});
			$scope.addIfOnBoard(validMoves, {x:(piece.x), y:(piece.y - 1)});
			$scope.addIfOnBoard(validMoves, {x:(piece.x + 1), y:(piece.y - 1)});
		}
		//TODO: taking your own king is illegal, remove that move from list?
			
		return validMoves;
	}
});
  
gasTankApp.factory('HumanPieces', function() {
	var pieces = [
		{
			'symbol': 'N',
			'x': 1,
			'y': 6
		},
		{
			'symbol': 'B',
			'x': 2,
			'y': 6
		},
		{
			'symbol': 'Q',
			'x': 3,
			'y': 6
		},
		{
			'symbol': 'K',
			'x': 4,
			'y': 6
		},
		{
			'symbol': 'B',
			'x': 5,
			'y': 6
		},
		{
			'symbol': 'N',
			'x': 6,
			'y': 6
		}
	];
	return pieces;
});

gasTankApp.factory('ComputerPieces', function() {
	var pieces = [
		{
			'symbol': 'N',
			'x': 1,
			'y': 0
		},
		{
			'symbol': 'B',
			'x': 2,
			'y': 0
		},
		{
			'symbol': 'Q',
			'x': 3,
			'y': 0
		},
		{
			'symbol': 'K',
			'x': 4,
			'y': 0
		},
		{
			'symbol': 'B',
			'x': 5,
			'y': 0
		},
		{
			'symbol': 'N',
			'x': 6,
			'y': 0
		}
	];
	return pieces;
});