var PlatfomerGame = PlatformerGame || {};

//title screen
PlatformerGame.Game = function(){};

PlatformerGame.Game.prototype = {
    init: function(level) { 
        this.level = level;
    },
    create: function() {

        this.levelFile = "fun1";

        if (this.level) {
            this.levelFile = this.level;
        }



        this.walk_speed = 70;

        //  A simple background for our game
        this.game.add.sprite(0, 0, 'sky');
        
        this.map = this.game.add.tilemap(this.levelFile);

        this.map.addTilesetImage('penguins', 'tiles');

        this.towers = this.game.add.group();

        //this.blockedLayer = this.map.createLayer('objectLayer');
        this.blockedLayer = this.map.createLayer('blockedLayer');
        //this.foregroundLayer = this.map.createLayer('foregroundLayer');

        this.particles = this.game.add.group();
        this.particles.enableBody = true;
        

        this.map.setCollisionBetween(1, 10000, true, 'blockedLayer');

        // make the world boundaries fit the ones in the tiled map
        this.blockedLayer.resizeWorld();

        this.players = this.game.add.group();
        this.players.enableBody = true;

        var result = this.findObjectsByType('finish', this.map, 'objectLayer');
        this.lady = this.game.add.sprite(result[0].x, result[0].y, 'tower');
        this.lady.frame = 3;
        this.lady.anchor.setTo(0.5);
        this.lady.animations.add('jump', [3,4], 10, true);
        this.lady.animations.play('jump');

        this.finish = this.game.add.sprite(result[0].x, result[0].y, 'tower');
        this.finish.frame = 2;
        this.game.physics.arcade.enable(this.finish);
        this.finish.anchor.setTo(0.5);
        this.finish.body.setSize(20,32,0,0);
        
        result = this.findObjectsByType('playerStart', this.map, 'objectLayer');
        this.playerSpawner = this.players.create(result[0].x, result[0].y, 'tower');
        this.playerSpawner.anchor.setTo(0.5);
        this.playerSpawner.visible = false;
        this.stars = this.game.add.group();

        //  We will enable physics for any star that is created in this group
        this.stars.enableBody = true;

        this.music = this.game.add.audio('music');
        this.music.loop = true;
        this.music.volume = 0.6;
        this.music.loopFull();

        //  The score
        this.statusText = this.game.add.text(116, 16, "Wave 1! Get ready!\nClick to place towers (cost: $100)\nDon't let them save the princess!", { fontSize: '16px', fill: '#000' });
        this.cash = 150;
        this.cashText = this.game.add.text(416, 16, "$" + this.cash, { fontSize: '16px', fill: '#000' });
        this.timer = 0;

        this.showDebug = false; 
    //    this.game.world.bringToTop(this.players);

        this.game.input.onTap.add(this.onTap, this);

        this.peng = 0;
        this.rescue = false;
        
        this.spawnRate = 120;
        this.spawnPause = true;
        this.ready = 300;
        this.readyBuffer = 300;

    },



    onTap : function (pointer, doubleTap) {

        doubleTap = true;

        if( this.game.input.y > 300 || this.game.input.y < 200) {
            return;
        }


        if (this.cash >= 100) {
            this.cash -= 100;
            this.cashText.text = "$" + this.cash;
            var y = 304-64;
            var x = Math.floor(this.game.input.x-16);
            this.createTower(x,y);
        }
    },

    createTower : function (x, y) {
        var tower = this.towers.create(x, y, 'tower');
        tower.frame = 1; 
        tower.coolDown = 10;

    },

    createPlayer : function (x, y) {
        var player = this.players.create(x, y, 'td');
        player.frame = 0; 

        player.body.bounce.y = 0;
        player.body.gravity.y = 400;
        player.anchor.setTo(0.5);
        player.body.collideWorldBounds = false;
        player.fall = 0;
        player.dead = false;
        player.body.setSize(16,16,20,8);

        //this.game.camera.follow(this.player);

        //  Our two animations, walking left and right.
        player.animations.add('walk', [3, 4], 10, true);
        
        player.animations.play('walk');

        player.body.velocity.x = -this.walk_speed;
    },

    update: function() {


        this.timer++;

        if (this.timer % this.spawnRate == 0 && !this.spawnPause) {
            this.createPlayer(this.playerSpawner.x, this.playerSpawner.y);
            this.peng++;
        }

        if (this.peng == 5) {
            this.spawnPause = true;
            this.statusText.text = "Wave 2! Get ready!";
            this.ready = this.timer + this.readyBuffer;
            this.spawnRate = 100;
            this.peng += 1;
        }

        if (this.peng == 12) {
            this.spawnPause = true;
            this.statusText.text = "Wave 3! Get ready!";
            this.ready = this.timer + this.readyBuffer;
            this.spawnRate = 60;
            this.peng += 1;
        }

        if (this.peng == 28) {
            this.spawnPause = true;
            this.statusText.text = "Wave 4! Get ready!";
            this.ready = this.timer + this.readyBuffer;
            this.spawnRate = 40;
            this.peng += 1;
        }

        if (this.peng == 36) {
            this.spawnRate = 30;
        }

        if (this.peng == 60) {
            this.spawnPause = true;
            this.statusText.text = "Final Wave! Get ready!";
            this.ready = this.timer + this.readyBuffer + 200;
            this.spawnRate = 13;
            this.peng += 1;
        }
        if (this.peng == 75) {
            this.spawnRate = 12;
        }
        if (this.peng == 90) {
            this.spawnRate = 10;
        }

        if (this.peng == 100) {
            this.peng += 1;
            this.win = true;
            this.spawnPause = true;
            this.statusText.text = "Well done, you win!";

        }

        if (this.timer === this.ready) {
            this.spawnPause = false;
        }


        this.game.physics.arcade.collide(this.players, this.blockedLayer, this.collideSoldier, null, this);

        this.game.physics.arcade.overlap(this.players, this.stars, this.death, null, this);
        this.game.physics.arcade.overlap(this.finish, this.players, this.exit, null, this);

        this.players.forEach(function(player) {
            if (this.rescue) {
                player.body.velocity.x = 0;
                player.animations.stop();
                player.frame = 3;
            }
            if (!player.dead) {
                if (player.body.blocked.down) {
                    if (player.fall > 45) {
                        player.animations.play("fall");
                        player.body.velocity.x = 0;
                        this.finish.body.setSize(0,0,0,0);
                        player.dead = true;
                        this.pengFinished++;
                        this.penguinsDead++;
                        this.penguinsDeadText.text = 'Dead: ' + this.penguinsDead + " / " + this.penguinsTotal;
                        this.score -= 10;

                    }
                    else  {
                        player.fall = 0;
                    }
                }
                else if (player.body.velocity.y > 0) {
                    player.fall++;
                }
                if (player.y > this.game.world.height || player.x > this.game.world.width || player.x < 0) {
                    player.destroy();
                    /*
                    this.score -= 10;
                    this.scoreText.text = 'Score: ' + this.score;
                    */
                    this.pengFinished++;
                    this.penguinsDead++;
//                    this.penguinsDeadText.text = 'Dead: ' + this.penguinsDead + " / " + this.penguinsTotal;

                }
            }
        }, this);

        this.towers.forEach(function(tower) {
            if (!this.rescue) {

                if (tower.coolDown == 0 && this.players.length > 0) {
                    var target = null;
                    this.players.forEach(function(soldier) {
                        if (this.distanceBetweenTwoPoints(tower, soldier) < 120 && soldier.alive) {
                            target = soldier
                        }
                    }, this);
                    if (target != null) {
                        this.shoot(tower, target);
                        tower.coolDown = 100;
                    }
                }
                else {
                    tower.coolDown--;
                }
            }
        }, this);

        this.stars.forEach(function(fireball) {
            if (fireball.coolDown > 1) {
                fireball.coolDown -= 1;
            }
            if(fireball.coolDown == 1) {
                fireball.kill();
            }
        }, this);


    },


    distanceBetweenTwoPoints: function(a, b) {
        var xs = b.x - a.x;
        xs = xs * xs;

        var ys = b.y - a.y;
        ys = ys * ys;

        return Math.sqrt(xs + ys);
    },

    shoot : function(tower, soldier) {
        var fireball = this.stars.create(tower.x+54, tower.y+24, 'td');
        fireball.scale.setTo(-1, 1);
        fireball.angle = 45;
        fireball.body.velocity.x = 130;
        fireball.body.velocity.y = 100;
        fireball.body.gravity.y = 10;
        fireball.frame = 1;
        fireball.target = soldier;
        fireball.body.setSize(2,2,0,0);
        fireball.coolDown = 0;

    },

    death : function(soldier, star) {

        if (star.frame != 2) {
            soldier.kill();
            star.frame = 2;
            star.body.velocity.x = 0;
            star.body.velocity.y = 0;
            star.coolDown = 10;
            this.cash += 10;
            this.cashText.text = "$" + this.cash;
        }

    },

    collideSoldier : function(penguin, block) {

        
        // Removes the star from the screen
        if (penguin.body.blocked.right) {
            penguin.body.velocity.x = -1 * this.walk_speed;
            penguin.scale.setTo(-1,1);

        } 
        else if (penguin.body.blocked.left) {
            penguin.body.velocity.x = this.walk_speed;
            penguin.scale.setTo(1,1);

        } 

        if (penguin.body.blocked.down && block.index === 9) {
            penguin.body.velocity.y = -200;
            block.index = 10;
            this.map.replace(9, 10, Math.floor(block.x/16), Math.floor(block.y/16), 1, 1, 'blockedLayer' );
            
        }
        else if (penguin.body.blocked.down && block.index === 10) {
            penguin.body.velocity.y = -200;
            block.index = 9;
        }

    },

    exit : function(exit, penguin) {

        this.statusText.text = "Oh no, they rescued the princess!\nYou lose!";
        this.rescue = true;
        this.finish.frame = 5;

    },



    // find objects in a tiled layer that contains a property called "type" equal to a value
    findObjectsByType: function(type, map, layer) {
        var result = new Array();
        map.objects[layer].forEach(function(element) {
            if (element.properties.type === type) {
                // phaser uses top left - tiled bottom left so need to adjust:
                element.y -= map.tileHeight;
                result.push(element);
            }
        });
        return result;
    },

    createFromTiledObject: function(element, group) {
        var sprite = group.create(element.x, element.y, 'objects');
        sprite.frame = parseInt(element.properties.frame);

        // copy all of the sprite's properties
        Object.keys(element.properties).forEach(function(key) {
            sprite[key] = element.properties[key];
        });
    },


    render: function() {

        if (this.showDebug) {
            this.game.debug.body(this.finish);
            
        }
    },

};
