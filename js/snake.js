// the main game class
function SnakeGame(canvas, player_num) {
  //the game constants
  var LEFT = 37, UP = 38, RIGHT = 39, DOWN = 40,
  CELL_SIZE = 10,
  PI = Math.PI,
  MAX_X = 60, MAX_Y = 40,
  INITIAL_SNAKE_LENGTH = 4;

  //Canvas and Drawing Context
  // 0th index contains the HTML part of the canvas jquery object
  var canvas = $(canvas)[0];
  var ctx = canvas.getContext('2d');

  var timer_game,		//game loop
  timer_keys,
  timer_time,
  game_time = 200,
  pause_game = false,
  food,
  no_of_players = player_num,
  snake1, snake2;

  var pressedKeys = [];
  
  var KEY = {
    //directions keys for left snake
    ONE_LEFT: 37,
    ONE_UP: 38,
    ONE_RIGHT: 39,
    ONE_DOWN: 40,
    //direction keys for right snake
    TWO_LEFT: 65,
    TWO_UP: 87,
    TWO_RIGHT: 68,
    TWO_DOWN: 83,
    SPACE: 32
  }

  $(document).keydown(function(e) {
    //e.which contains the ASCII value of the pressed key
    pressedKeys[e.which] = true;
  });

  $(document).keyup(function(e) {
    pressedKeys[e.which] = false;
  });

  /**
   * The Snake Class that creates a Snake object having head, body and tail with respective colors
   * @param initial_bit bit(x, y) The starting position of the snake in the canvas
   * @param initial_direction DIRECTION The starting direction of the snake
   * @param head_color COLOR_STRING The color of the head of the snake
   * @param body_color1 COLOR_STRING One of the two body colors of the snake
   * @param body_color2 COLOR_STRING The other body color of the snake
   * @param tail_color COLOR_STRING The color of the tail of the snake
   */
  function Snake(initial_bit, initial_direction, head_color, body_color1, body_color2, tail_color) {
    this.bits = [];
    this.addBit(initial_bit);
    this.heading = initial_direction;
    this.bitsToGrow = INITIAL_SNAKE_LENGTH;
    this.head_color = head_color;
    this.body_color1 = body_color1;
    this.body_color2 = body_color2;
    this.tail_color = tail_color;
    this.score = 0;
  }

  /**
   * Add a bit to the Snake Object in its bits array
   * @param bit bit(x,y)
   */
  Snake.prototype.addBit = function(bit) {
    this.bits.unshift(bit);
  }

  /**
   * Move the snake towards the direction it's heading
   */
  Snake.prototype.advance = function() {
    this.head = this.bits[0];
    switch(this.heading) {
      case LEFT:
        this.addBit(bit(this.head.x - 1, this.head.y));
        break;
      case UP:
        this.addBit(bit(this.head.x, this.head.y - 1));
        break;
      case RIGHT:
        this.addBit(bit(this.head.x + 1, this.head.y));
        break;
      case DOWN:
        this.addBit(bit(this.head.x, this.head.y + 1));
        break;
    }
    //remove the tail
    if(0 === this.bitsToGrow) {
      // no growth needed
      this.bits.pop();
    } else {
      //leave old tip of tail for growth and 
      //decrement bitsToGrow
      this.bitsToGrow--;
    }
  }

  /**
   * Check if the randomly palced food is in the snake
   * @return boolean
   */
  Snake.prototype.containsFood = function(x, y, includeHead) {
    var length = this.bits.length;
    i = includeHead ? 0 : 1;
    for(; i < length; i++) {
      if(x == this.bits[i].x && y == this.bits[i].y)
        return true;
    }
    return false;
  }

  /**
   * Check whether the Snake Object collides with the food, the canvas border or itself
   */
  Snake.prototype.checkCollision = function() {
    //end game if out of the canvas
    if( (this.head.x * CELL_SIZE >= canvas.width) || (this.head.y * CELL_SIZE >= canvas.height) || (this.head.x <= -1) || (this.head.y <= -1) ) {
      if(snake2)
        this.score -= generateRandom(10, 50);
        endGame();
    }

    //collision of head with food
    if(collides(this.head, food)) {
      if(!snake2) $('#yummy_kid').trigger('play');
      else {
        if(this == snake1) $('#yes_boy').trigger('play');
        else $('#yes_girl').trigger('play');
      }
      placeFood();
      this.bitsToGrow++;
      this.score += 10;
      game_time += 20;
    }

    //collision of snake with itself
    for(var i = 2; i < this.bits.length; i++)
      if( collides(this.head, this.bits[i]) ) {
        if(snake2) this.score -= generateRandom(10, 50);
        endGame();
      }
  }

  Snake.prototype.collidesWith = function(other_snake) {
    //collision of the with other snake
    for(var i = 0; i < other_snake.bits.length; i++)
      if( collides(this.head, other_snake.bits[i]) ) {
        other_snake.bits.pop();
        other_snake.score -= 5;
        return true;
      }
    return false;
  }

  /**
   * Draw the Snake Object in the canvas
   */
  Snake.prototype.draw = function() {
    //call drawBit on each snake bit
    var i, length = this.bits.length;
    for (i = 0; i < length; i++) {
      if(i == 0) ctx.fillStyle = this.head_color; // head
      else if(i == length - 1) ctx.fillStyle = this.tail_color; // tail
      else if(i % 2 == 0) ctx.fillStyle = this.body_color2; // body
      else ctx.fillStyle = this.body_color1; // body
      drawBit(this.bits[i]);
    }
  }

  /**
   * Create a simple bit object with attributes 'x' and 'y'
   */
  function bit(x, y) {
    return {
      x: x, 
      y: y
    };
  }
  
  /**
   * Create the Snake(s) Object(s) as required
   */
  function createSnake() {
    //starting x and y position of left snake (4, 4)
    snake1 = new Snake(bit(4,6), RIGHT, "brown", "gray", "black", "blue");
    if(no_of_players == 2) {
      snake2 = new Snake(bit(64,6), LEFT, "orange", "yellow", "green", "purple")
    }
  }

  /**
   * Starting point of the application
   */
  function startGame() {
    clearCanvas();
    createSnake();
    placeFood();
    //if prev game running, clear timer
    clearInterval(timer_game);
    clearInterval(timer_keys);
    //speed of game/snake
    timer_game = setInterval(gameLoop, 150);
    //the key events should be updated faster
    timer_keys = setInterval(updateGame, 20);
  }

  function updateTime() {
    ctx.font = "20pt Calibri";
    ctx.fillStyle = "cyan";
    // align text horizontally center
    ctx.textAlign = "center";
    // align text vertically center
    ctx.textBaseline = "middle";
    ctx.fillText("Time: " + game_time--, 60, 35);
    if(game_time <= 0) endGame();
  }

  /**
   * Generate random numbers between the given min and max
   */
  function generateRandom(min, max) {
    return Math.floor( Math.random() * (max - min + 1) ) + min;
  }
  
  /**
   * Place the Food Object randomly in the canvas
   */
  function placeFood() {
    var x = generateRandom(5, MAX_X - 5);
    var y = generateRandom(5, MAX_Y - 5);
    //check for collision
    if(inSnake(x, y, true)) return placeFood();
    food = {
      x:x, 
      y:y
    };
  }

  /**
   * Check if x and y are in the snake
   */
  function inSnake(x, y, includeHead) {
    if(snake1.containsFood(x, y, includeHead)) return true;
    if(snake2) {
      if(snake2.containsFood(x, y, includeHead)) return true;
    }
    return false;
  }

  /**
   * The actual game loop
   */
  function gameLoop() {
    //update_direction();
    advanceSnake();
    checkCollision();
    clearCanvas();
    drawSnake();
    drawFood();
    updateScore();
    updateTime();
  }
  
  /**
   * Update different aspects of the game
   */
  function updateGame() {
    updateGameState();
    updateDirection();
  }

  /**
   * Update the current game score in respective panels
   */
  function updateScore() {
    ctx.font = "20pt Calibri";
    ctx.fillStyle = "cyan";
    // align text horizontally center
    ctx.textAlign = "center";
    // align text vertically center
    ctx.textBaseline = "middle";
    ctx.fillText("P1: " + snake1.score, canvas.width - 50, 35);
    if(snake2) ctx.fillText("P2: " + snake2.score, canvas.width - 50, canvas.height - 15);
  }

  /**
   * Update Game Status (PAUSE, RESUME)
   */
  function updateGameState() {
    if(pressedKeys[KEY.SPACE]) {
      if(!pause_game) {
        pause_game = true;
        clearInterval(timer_game);
      } else {
        pause_game = false;
        timer_game = setInterval(gameLoop, 100);
      }
    }
  }

  /**
   * Update the direction of the Snake(s) Object(s) according to the pressed keys
   */
  function updateDirection() {
    if(pressedKeys[KEY.ONE_LEFT] && snake1.heading != RIGHT) {
      snake1.heading = LEFT;
    }
    if(pressedKeys[KEY.ONE_UP] && snake1.heading != DOWN) {
      snake1.heading = UP;
    }
    if(pressedKeys[KEY.ONE_RIGHT] && snake1.heading != LEFT) {
      snake1.heading = RIGHT;
    }
    if(pressedKeys[KEY.ONE_DOWN] && snake1.heading != UP) {
      snake1.heading = DOWN;
    }
    if(snake2) {
      // update direction for second snake
      if(pressedKeys[KEY.TWO_LEFT] && snake2.heading != RIGHT) {
        snake2.heading = LEFT;
      }
      if(pressedKeys[KEY.TWO_UP] && snake2.heading != DOWN) {
        snake2.heading = UP;
      }
      if(pressedKeys[KEY.TWO_RIGHT] && snake2.heading != LEFT) {
        snake2.heading = RIGHT;
      }
      if(pressedKeys[KEY.TWO_DOWN] && snake2.heading != UP) {
        snake2.heading = DOWN;
      }
    }
  }

  /**
   * Advance Snake(')(s)(') position by calling the advance method of the Snake Object
   */
  function advanceSnake() {
    snake1.advance();
    if(snake2) snake2.advance();
  }

  /**
   * Call the checkCollision method of the Snake Object
   */
  function checkCollision() {
    snake1.checkCollision();
    if(snake2) {
      snake2.checkCollision();
      if(snake1.collidesWith(snake2)) {
        $('#ouch_girl').trigger('play');
      }
      if(snake2.collidesWith(snake1)) {
        $('#ouch_boy').trigger('play');
      }
    }
  }
  
  /**
   * Check if two objects with properties 'x' and 'y' each collide
   * @return boolean
   */
  function collides(a, b) {
    if(a.x == b.x && a.y == b.y) return true;
    return false;
  }
  
  /**
   * End the running game by clearing the timer and show the game over screen
   */
  function endGame() {
    if(!snake2) $('#ouch_kid').trigger('play');
    else $('#game_over').trigger('play');
    clearCanvas();
    clearInterval(timer_game);
    clearInterval(timer_keys);
    clearInterval(timer_time);
    if(snake2) {
      var score_display = "Snake1: " + snake1.score + "<br />Snake2: " + snake2.score + "<br />";
      if(snake1.score > snake2.score) {
        score_display += "<b>Snake1 Wins!!!</b>";
      } else if(snake2.score > snake1.score) {
        score_display += "<b>Snake2 Wins!!!</b>";
      } else {
        score_display += "It's a tie!!!";
      }
      $('#score-display').html(score_display);
    }
    else $('#score-display').html("Score: " + snake1.score);
    if(!snake2) {
      if(snake1.score > 50) $('#score-message-heading').html('Nice Attempt!');
      else $('#score-message-heading').html('Oh! that was a bad luck!');
    }
    $('#info-modal').modal('show');
  }

  /**
   * Clear the canvas of all shapes and fills
   */
  function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  /**
   * Draw the Food Object in the canvas
   */
  function drawFood() {
    drawInCell(food.x, food.y, function() {
      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.arc(CELL_SIZE/2, CELL_SIZE/2,
          CELL_SIZE/2, 0, 2*PI, true);
      ctx.fill();
    })
  }

  /**
   * Call the draw method of the Snake Object
   */
  function drawSnake() {
    snake1.draw();
    if(snake2) snake2.draw();
  }

  /**
   * Draw one segment or bit of the snake
   */
  function drawBit(bit) {
    drawInCell(bit.x, bit.y, function() {
      ctx.beginPath();
      ctx.rect(0,0, CELL_SIZE, CELL_SIZE)
      ctx.fill();
    });
  };

  /**
   * Called in drawBit() method to actually draw in the canvas context
   */
  function drawInCell(cellX, cellY, fn) {
    var x = cellX * CELL_SIZE,
    y = cellY * CELL_SIZE;

    ctx.save();
    ctx.translate(x,y);
    fn();
    ctx.restore();
  }

  return {
    start: startGame
  }
}; // end of class SnakeGame

//starting of the game
$(function() {
  $('#start-modal').modal('show');
  $('.modal').draggable();
  var no_of_players = 1;
  $('#one_player_btn').click(function() {
    $(this).html('Enjoy the game alone!').removeClass('btn btn-info').addClass('label label-warning');
    $('#two_player_btn').html('Two Player').removeClass('label label-warning').addClass('btn btn-info');
    no_of_players = 1;
    $('#start_btn').removeClass('hide');
  });
  $('#two_player_btn').click(function() {
    $(this).html('Is there anyone beside you?').removeClass('btn btn-info').addClass('label label-warning');
    $('#one_player_btn').html('One Player').removeClass('label label-warning').addClass('btn btn-info');
    no_of_players = 2;
    $('#start_btn').removeClass('hide');
  });
  $('#start_btn').click(function() {
    if(no_of_players == 1) {
      $('#snake2-info').hide();
      $('#snake1-info-heading').html('Snake Controls');
    }
    window.game = SnakeGame('#game-canvas', no_of_players);
    game.start();
  });
});
