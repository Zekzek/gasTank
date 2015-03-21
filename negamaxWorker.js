
	var numColumns = 8;
	var numRows = 7;
	var TOP = -1;
	var BOTTOM = 1;
	var PLAYERS = [TOP,BOTTOM];
	
  	var negamax = function(board, depth, playerId) {
		if (depth == 0) {//TODO: or leaf
			var result = {'moves':[], 'value':(playerId * getHeuristic(board))};
			return result;
		}
		var bestResult = {'value':Number.NEGATIVE_INFINITY};
		var childBoards = getChildBoards(board, playerId);
		for (var i in childBoards) {
			var result = negamax(childBoards[i], depth - 1, -playerId);
			result.value = -result.value;
			if (result.value > bestResult.value) {
				var bestResult = result;
				var bestMove = childBoards[i].move;
			}
		}
		bestResult.moves.push(bestMove);
		return bestResult;
	}
	
	var getHeuristic = function(board) {
		var score = 0; 	
		for (var i in PLAYERS) {
			for (var j in board.pieces[PLAYERS[i]]) {
				if (board.pieces[PLAYERS[i]][j].gas == 0) {
					var multiplier = PLAYERS[i] * 0.2;
				}
				else {
					var multiplier = PLAYERS[i] * (0.7 + board.pieces[PLAYERS[i]][j].gas / 10);
				}
				if (board.pieces[PLAYERS[i]][j].symbol == 'K') {
					score += 100000 * multiplier;
				}
				else if (board.pieces[PLAYERS[i]][j].symbol == 'Q') {
					score += 50 * multiplier;
				}
				else {
					score += 30 * multiplier;
				}
			}
		}
		return score;
	}
	
	var getChildBoards = function(board, playerId) {
		var boards = [];
		for(var i in board.pieces[playerId]) {
			var moves = getValidMovesFor(board, board.pieces[playerId][i]);
			for (var j in moves) {
				var boardCopy = JSON.parse(JSON.stringify(board));
				makeMove(boardCopy, boardCopy.pieces[playerId][i], moves[j]);
				boardCopy.move = [board.pieces[playerId][i], moves[j]];
				boards.push(boardCopy);
			}
		}
		return boards;
	}
	
	var makeMove = function(board, piece, pos) {
		if (removePieceAt(board, pos)) {
			piece.gas = 3;
		}
		else {
			piece.gas--;
		}
		piece.x = pos.x;
		piece.y = pos.y;
	}
	
	var removePieceAt = function(board, pos) {
		for (var i in PLAYERS) {
			for (var j in board.pieces[PLAYERS[i]]) {
				if (board.pieces[PLAYERS[i]][j].x == pos.x && board.pieces[PLAYERS[i]][j].y == pos.y) {
					board.pieces[PLAYERS[i]].splice(j, 1);
					return true;
				}
			}
		}
		return false;
	}
	
	var onBoard = function(move) {
		return move.x >= 0 && move.x < numColumns
			&& move.y >= 0 && move.y < numRows;
	}
	
	var addIfOnBoard = function(list, move) {
		if (onBoard(move)) {
			list.push(move);
			return true;
		}
		return false;
	}
	
	var getAtPos = function(board, pos) {
		for (var i in PLAYERS) {
			for (var j in board.pieces[PLAYERS[i]]) {
				if (board.pieces[PLAYERS[i]][j].x == pos.x && board.pieces[PLAYERS[i]][j].y == pos.y) {
					return board.pieces[PLAYERS[i]][j];
				}
			}
		}
	}
	
	var isValidMove = function(board, piece, endPos) {
		var moves = getValidMovesFor(board, piece);
		for (var i in moves) {
			if (moves[i].x == endPos.x && moves[i].y == endPos.y) {
				return true;
			}
		}
		return false; 
	}
	
	var getValidMovesFor = function(board, piece) {
		var validMoves = [];
		if (piece.gas == 0) {
			return validMoves;
		}
		if (piece.symbol == 'N' || piece.symbol == 'Q') {
			addIfOnBoard(validMoves, {x:(piece.x + 1), y:(piece.y + 2)});
			addIfOnBoard(validMoves, {x:(piece.x + 1), y:(piece.y - 2)});
			addIfOnBoard(validMoves, {x:(piece.x - 1), y:(piece.y + 2)});
			addIfOnBoard(validMoves, {x:(piece.x - 1), y:(piece.y - 2)});
			addIfOnBoard(validMoves, {x:(piece.x + 2), y:(piece.y + 1)});
			addIfOnBoard(validMoves, {x:(piece.x + 2), y:(piece.y - 1)});
			addIfOnBoard(validMoves, {x:(piece.x - 2), y:(piece.y + 1)});
			addIfOnBoard(validMoves, {x:(piece.x - 2), y:(piece.y - 1)});
		}
		if (piece.symbol == 'B' || piece.symbol == 'Q') {
			var x = 1;
			var y = 1;
			while(addIfOnBoard(validMoves, {x:(piece.x + x), y:(piece.y + y)}) && !getAtPos(board, {x:(piece.x + x), y:(piece.y + y)})) {
				x++;
				y++;
			}
			x = 1;
			y = -1;
			while(addIfOnBoard(validMoves, {x:(piece.x + x), y:(piece.y + y)}) && !getAtPos(board, {x:(piece.x + x), y:(piece.y + y)})) {
				x++;
				y--;
			}
			x = -1;
			y = -1;
			while(addIfOnBoard(validMoves, {x:(piece.x + x), y:(piece.y + y)}) && !getAtPos(board, {x:(piece.x + x), y:(piece.y + y)})) {
				x--;
				y--;
			}
			x = -1;
			y = 1;
			while(addIfOnBoard(validMoves, {x:(piece.x + x), y:(piece.y + y)}) && !getAtPos(board, {x:(piece.x + x), y:(piece.y + y)})) {
				x--;
				y++;
			}
		}
		else if (piece.symbol == 'K') {
			addIfOnBoard(validMoves, {x:(piece.x - 1), y:(piece.y + 1)});
			addIfOnBoard(validMoves, {x:(piece.x), y:(piece.y + 1)});
			addIfOnBoard(validMoves, {x:(piece.x + 1), y:(piece.y + 1)});
			addIfOnBoard(validMoves, {x:(piece.x - 1), y:(piece.y)});
			addIfOnBoard(validMoves, {x:(piece.x + 1), y:(piece.y)});
			addIfOnBoard(validMoves, {x:(piece.x - 1), y:(piece.y - 1)});
			addIfOnBoard(validMoves, {x:(piece.x), y:(piece.y - 1)});
			addIfOnBoard(validMoves, {x:(piece.x + 1), y:(piece.y - 1)});
		}
		//TODO: taking your own king is illegal, remove that move from list?
			
		return validMoves;
	}
	
onmessage = function(e) {
	var result = negamax(e.data[0], e.data[1], e.data[2]);
	result.value = -result.value;
	result.index = e.data[3];
	postMessage(result);
	close();
};