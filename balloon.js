var ballonHeight = 75; //pixel
var ballonWidth = 50; //pixel
var ballonFlameLighter = 60; //percent
var ballonFlame = 'yellow';
var flameSize = 3; //pixel
var gondolaSize = 10; //pixel
var gondolaColor = '#150517';
var ballonFallRate = 0.05;
var ballonClimbRate = 0.1;
var ballonClimbRateBase = 60;//animFrame
var ballonClimbRateRandom = 500;//variable animFrame
var ballonCount = 5; //count
var windSpeed = 0.5;
var redrawClearMargin = 3;
var collisionMarginSensitivity = 2;

var starIntenistyGrades = 1;
var starIntensityStep = -30; // percent
var starCount = 200;
var canvasBackground = '#463E41';

var canvas = document.getElementById('mainCanvas');
canvas.style.background = canvasBackground;
canvas.width = window.innerWidth - 5;
canvas.height = window.innerHeight - 5;

var ctx = canvas.getContext('2d');
ctx.lineWidth = 0;

window.requestAnimFrame = (function(){
	return window.requestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame ||
	function( callback ) {
		window.setTimeout(callback, 1000 / 60);
	};
})();

function randomInt(max) {
	return Math.floor(Math.random() * max);
}

function shadeColor(color, percent) {
	var num = parseInt(color.slice(1),16), amt = Math.round(2.55 * percent), R = (num >> 16) + amt, B = (num >> 8 & 0x00FF) + amt, G = (num & 0x0000FF) + amt;
	return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (B<255?B<1?0:B:255)*0x100 + (G<255?G<1?0:G:255)).toString(16).slice(1);
}

function getBallonColor() {
	var r = randomInt(50).toString(16);
	var g = randomInt(50).toString(16);
	var b = randomInt(50).toString(16);

	r = r.length < 2 ? '0' + r : r;
	g = g.length < 2 ? '0' + g : g;
	b = b.length < 2 ? '0' + b : b;

	return '#' + r + g + b;
}

function checkCollision(obj1, obj2) {
	return !(
		(obj1.y + obj1.height < obj2.y) ||
		(obj1.y > obj2.y + obj2.height) ||
		(obj1.x > obj2.x + obj2.width) ||
		(obj1.x + obj1.width < obj2.x)
	);
}

var Star = function (x, y){
	this.x = x;
	this.y = y;
	this.color = '#FFFFFF';

	this.blinkCounter = 0;
	this.blinkRate = 60 + randomInt(100);
	this.intensity = Math.floor(Math.random() * starIntenistyGrades);
};
Star.prototype.draw = function () {
	this.blinkCounter = (this.blinkCounter + 1) % this.blinkRate;

	if (this.blinkCounter === 0) {
		this.intensity = (this.intensity + 1) % (starIntenistyGrades + 1);
	}
	ctx.fillStyle = shadeColor(this.color, starIntensityStep * this.intensity);

	ctx.beginPath();
	ctx.arc(this.x, this.y, 1, 0, 2 * Math.PI, true);
	ctx.fill();
};

var Ballon = function (x, y, id) {
	this.x = x;
	this.y = y;
	this.dy = 0;
	this.dx = 0;
	this.id = id;
	this.height = ballonHeight;
	this.width = ballonWidth;
	this.radius = (this.height > this.width ? this.width : this.height) / 2;
	this.boxHeight = gondolaSize;
	this.color = getBallonColor();
	this.climbInterval = ballonClimbRateBase + randomInt(ballonClimbRateRandom);
	this.climbCounter = 0;
	this.climbing = Math.random() > 0.5;
	this.responsiveness = Math.random();
};
Ballon.prototype.clear = function () {
	ctx.clearRect(this.x - 1, this.y - 1, this.width + 1, this.height + 1);
};
Ballon.prototype.checkCollision = function (dx, dy) {
	var collisionFlag = false;
	var testBallon = {
		x: this.x + dx - collisionMarginSensitivity * redrawClearMargin,
		y: this.y + dy - collisionMarginSensitivity * redrawClearMargin,
		width: ballonWidth + 2 * collisionMarginSensitivity * redrawClearMargin,
		height: ballonHeight + 2 * collisionMarginSensitivity * redrawClearMargin
	};
	for (var j = 0; j < ballons.length && !collisionFlag; j ++) {
		if (j !== this.id) {
			collisionFlag = checkCollision(testBallon, ballons[j]);
		}
	}

	return collisionFlag;
},
Ballon.prototype.move = function () {
	var newX = this.x;
	var newY = this.y;

	this.climbCounter = (this.climbCounter + 1) % this.climbInterval;
	
	if (this.climbCounter === 0) {
		this.climbing = !this.climbing;
	}
	this.dy = this.responsiveness * (this.climbing ? -1 * ballonClimbRate : ballonFallRate);
	var localWindSpeed = this.responsiveness * windSpeed;

	if (!this.checkCollision(localWindSpeed, this.dy)) {
		newX += localWindSpeed;
		newY += this.dy;
	} else if (!this.checkCollision(localWindSpeed, 0)) {
		newX += localWindSpeed;
	} else if (!this.checkCollision(0, this.dy)) {
		newY += this.dy;
	} else if (this.climbing && !this.checkCollision(0, ballonFallRate)) {
		newY += ballonFallRate;
		this.climbing = false;
	} else if (!this.checkCollision(0, ballonFallRate)) {
		newY += ballonFallRate;
	} else {
		for (var k = 0; k < this.height; k++) {
			var factor = (this.climbing ? -1 : 1) * k;
			if (!this.checkCollision(0, factor)) {
				newY += factor;
				break;
			}
		}
	}

	if (newX > 0 && newX + this.width < canvas.width - redrawClearMargin) {
		this.x = newX;
	}
	if (newY > 0 && newY + this.height < canvas.height - redrawClearMargin) {
		this.y = newY;
	}
};
Ballon.prototype.draw = function () {
	this.drawShapes(redrawClearMargin);
	this.move();
	this.drawShapes(0);
};
Ballon.prototype.drawShapes = function (clearColor) {
	var ballonColor = this.color;
	if (this.climbing) {
		var linGrad = ctx.createLinearGradient(0, this.y, 0, this.y + this.height);
		linGrad.addColorStop(0, ballonColor);
		linGrad.addColorStop(1, shadeColor(ballonColor, ballonFlameLighter));

		ballonColor = linGrad;
	}
	ctx.fillStyle = clearColor > 1 ? canvasBackground : ballonColor;

	// top ballon circle
	ctx.beginPath();
	ctx.arc(this.x + this.width / 2, this.y + this.radius, this.radius + clearColor, Math.PI, 0, false);
	ctx.fill();
	
	// triangle
	ctx.beginPath();
	ctx.moveTo(this.x - clearColor, this.y + this.radius - clearColor - 1);
	ctx.lineTo(this.x - clearColor + this.width / 2, this.y + this.height - this.boxHeight + clearColor);
	ctx.lineTo(this.x - clearColor + this.width / 2 + clearColor + 1, this.y + this.height - this.boxHeight + clearColor);
	ctx.lineTo(this.x + clearColor + this.width, this.y + this.radius - clearColor - 1);
	ctx.lineTo(this.x - clearColor, this.y + this.radius - clearColor - 1);
	ctx.fill();
	
	// flame
	if (this.climbing) {
		ctx.fillStyle = clearColor > 1 ? canvasBackground : ballonFlame;
		ctx.beginPath();
		ctx.arc(this.x + this.width / 2, this.y + this.height - this.boxHeight, flameSize, 0, 2 * Math.PI, true);
		ctx.fill();
	}
	
	// gondol
	ctx.fillStyle = clearColor > 1 ? canvasBackground : gondolaColor;
	ctx.fillRect(this.x + this.width / 4 + this.width / 8 - clearColor, this.y + this.height - this.boxHeight - clearColor, this.width / 4 + 2 *clearColor, this.boxHeight + 2 * clearColor);
};

var stars = [];
for (var i = 0; i < starCount; i++) {
	stars[i] = new Star(randomInt(canvas.width), randomInt(canvas.height));
}

function generateTestBallon() {
	return {
		x: randomInt(canvas.width - ballonWidth),
		y: randomInt(canvas.height - ballonHeight),
		width : ballonWidth + 2 * collisionMarginSensitivity * redrawClearMargin,
		height : ballonHeight + 2 * collisionMarginSensitivity * redrawClearMargin
	};
}
var ballons = [];
var collisionFlag = false;
var testBallon = {};
for (var i = 0; i < ballonCount; i++) {
	do {
		collisionFlag = false;
		testBallon = generateTestBallon();
		for (var j = 0; j < ballons.length && !collisionFlag; j ++) {
			collisionFlag = checkCollision(testBallon, ballons[j]);
		}
	} while (collisionFlag);

	ballons[i] = new Ballon(testBallon.x, testBallon.y, i);
}

document.onkeydown = function(e) {
	if(e.keyCode == 37) {
		windSpeed -= 0.05;
	} else if(e.keyCode == 39) {
		windSpeed += 0.05;
	}  else if(e.keyCode == 38) {
		ballonClimbRate += 0.03;
	} else if(e.keyCode == 40) {
		ballonFallRate += 0.03;
	} else if (e.keyCode == 13) {
		ballonFallRate = 0.05;
		ballonClimbRate = 0.1;
		windSpeed = 0;
	}

	return false;
};

(function animloop(){
	requestAnimFrame(animloop);
	
	for (var i = 0; i < stars.length; i++) {
		stars[i].draw();
	}

	for (i = 0; i < ballons.length; i++) {
		ballons[i].draw();
	}
})();