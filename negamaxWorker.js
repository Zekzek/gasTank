
	var numColumns = 8;
	var numRows = 7;
	var TOP = -1;
	var BOTTOM = 1;
	var PLAYERS = [TOP,BOTTOM];
	var heuristicCount = 0;
	var endTime = 0;
	
  	var negamax = function(board, depth, alpha, beta, playerId, historicalMoves, name) {
		if (depth == 0 || checkForLoss(board, playerId)) {
			return playerId * getHeuristic(board, name) * (depth + 1);
		}
		var bestResult = Number.NEGATIVE_INFINITY;
		
		var moves = getAllMoves(board, playerId);
		// sort historically best move to the front
		for(var i in moves) {
			if (historicalMoves[depth - 1] && historicalMoves[depth - 1][0] && historicalMoves[depth - 1][1] 
					&& moves[i][0].x == historicalMoves[depth - 1][0].x 
					&& moves[i][0].y == historicalMoves[depth - 1][0].y
					&& moves[i][1].x == historicalMoves[depth - 1][1].x 
					&& moves[i][1].y == historicalMoves[depth - 1][1].y) {
				moves.unshift(moves.splice(i, 1)[0]);
				break;
			}
		}
		
		var bestMove = historicalMoves[depth-1];
		for (var i in moves) {
			var boardCopy = JSON.parse(JSON.stringify(board));
			makeMove(boardCopy, boardCopy.pieces[playerId][+moves[i][0].index], moves[i][1]);
			boardCopy.move = moves[i];
			
			if (Date.now() < endTime) {			
				var result = -negamax(boardCopy, depth - 1, -beta, -alpha, -playerId, historicalMoves, name);
			} 
			else {
				return bestResult;
			}
			if (result > bestResult) {
				var bestResult = result;
				bestMove = boardCopy.move;
			}
			if (result > alpha) {
				alpha = result;
			}
			if (alpha >= beta) {
				break;
			}
		}
		historicalMoves[depth-1] = bestMove;
		return bestResult;
	}
	
	var getHeuristic = function(board, name) {
		var score = 0; 	
		// for each team
		for (var i in PLAYERS) {
			// for each player on that team
			for (var j in board.pieces[PLAYERS[i]]) {
				var multiplier = PLAYERS[i];
				if (board.pieces[PLAYERS[i]][j].gas == 0) {
					var multiplier = PLAYERS[i] * 0.1;
				}
				else {
					var multiplier = PLAYERS[i] * (0.85 + board.pieces[PLAYERS[i]][j].gas / 20);
				}
				if (board.pieces[PLAYERS[i]][j].symbol == 'K') {
					score += 1000 * multiplier;
				}
				else if (board.pieces[PLAYERS[i]][j].symbol == 'Q') {
					score += 100 * multiplier;
				}
				else {
					score += 70 * multiplier;
				}
				if (name == "Threat") {
					score += multiplier * getThreateningHeuristic(board, board.pieces[PLAYERS[i]][j], -PLAYERS[i]);
				}
			}
		}
		heuristicCount++;
		return score;
	}
	
	var getThreateningHeuristic = function(board, piece, enemy) {
		var score = 0;
		var moves = getValidMovesFor(board, piece);
		for (var i in moves) {
			//for each enemy piece
			for (var j in board.pieces[PLAYERS[+enemy]]) {
				// if the enemy sits in one of the threatened squares
				if (board.pieces[PLAYERS[+enemy]][j].x == moves[i].x && board.pieces[PLAYERS[+enemy]][j].y == moves[i].y) {
					if (board.pieces[PLAYERS[+enemy]][j].symbol == 'K') {
						score += 50;
					}
					else {
						score += 5;
					}
				}
			}
		}
		return score;
	}
	
	var checkForLoss = function(board, turn) {
		var hasKing = false;
		var hasMoves = false;
		for (var i in board.pieces[turn]) {
			if (board.pieces[turn][i].symbol == 'K') {
				hasKing = true;
			}
			if (!hasMoves && getValidMovesFor(board, board.pieces[turn][i]).length > 0) {
				hasMoves = true;
			}
		}
		return !hasKing || !hasMoves;
	}
	
	var getAllMoves = function(board, playerId) {
		var moves = [];
		for(var i = 0; i < board.pieces[playerId].length; i++) {
			var piece = board.pieces[playerId][i];
			piece.index = i;
			var pieceMoves = getValidMovesFor(board, board.pieces[playerId][i]);
			for (var j in pieceMoves) {
				moves.push([piece, pieceMoves[j]]);
			}
		}
		return moves;
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
	var board = e.data[0];
	var turn = e.data[1];
	var historicalMoves = e.data[2];
	var name = e.data[3];
	var time = e.data[4];
	
	endTime = Date.now() + 1000 * time;

	for (var depth = 1; depth < 50 && Date.now() < endTime; depth++) {
		historicalMoves.unshift({});
		var score = negamax(board, depth, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, turn, historicalMoves, name);
		
		var foundBestMove = false;
		var bestMoveIndex = historicalMoves.length-1;
		// make sure its a friendly piece
		if (historicalMoves[ bestMoveIndex ] && historicalMoves[ bestMoveIndex ][0]) {
			for (var i in board.pieces[turn]) {
				if (board.pieces[turn][i].x == historicalMoves[ bestMoveIndex ][0].x && board.pieces[turn][i].y == historicalMoves[ bestMoveIndex ][0].y) {
					postMessage({"bestMove":historicalMoves[ historicalMoves.length-1 ], "depth":depth, "score":score});
					console.debug("heuristicCount: " + heuristicCount);	
					var foundBestMove = true;
				}
			}
		}
		//2nd chance, make sure its a friendly piece
		bestMoveIndex -= 1;
		if (!foundBestMove && historicalMoves[ bestMoveIndex ] && historicalMoves[ bestMoveIndex ][0]) {
			for (var i in board.pieces[turn]) {
				if (board.pieces[turn][i].x == historicalMoves[ bestMoveIndex ][0].x && board.pieces[turn][i].y == historicalMoves[ bestMoveIndex ][0].y) {
					postMessage({"bestMove":historicalMoves[ historicalMoves.length-1 ], "depth":depth, "score":score});
					console.debug("heuristicCount: " + heuristicCount);	
				}
			}
		}
		console.debug((endTime - Date.now()) + " remaining");
	}
	console.debug("done - " + (Date.now() - endTime) + " over");
	postMessage({"bestMove":historicalMoves[ historicalMoves.length-1 ], "depth":(depth-1), "score":score, "done":true});
	close();
};