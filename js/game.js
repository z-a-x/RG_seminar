var camera, scene, renderer;
var keyboard = new THREEx.KeyboardState();
var lastTime = 0;
var clock = new THREE.Clock();
var height = 0, speed=10.0;
var projector = new THREE.Projector();

var jump = {
    isJump : false,
    speed : 0.3,
    height : 50,
    step : 0
};




var textureAnimator = null;

var enemies = new Array();
var bullets = new Array();
var explosions = new Array();
var monsters = new Array();
var targets = new Array();

var WIDTH = 700, HEIGHT = 700;

// set some camera attributes
var VIEW_ANGLE = 75,
    ASPECT = WIDTH / HEIGHT,
    NEAR = 0.1,
    FAR = 10000;

var camera =
    new THREE.PerspectiveCamera(
        VIEW_ANGLE,
        ASPECT,
        NEAR,
        FAR);

var sprite;
var group;

var ogre;
var dae;
var morphs = [];


// MONSTER  Collada model
var loader = new THREE.ColladaLoader();
loader.options.convertUpAxis = true;
loader.load( 'models/collada/monster/monster.dae', function ( collada ) {
    dae = collada.scene;
    dae.traverse( function ( child ) {
        if ( child instanceof THREE.SkinnedMesh ) {
            var animation = new THREE.Animation( child, child.geometry.animation );
            animation.play();
        }
    } );

    dae.scale.x = dae.scale.y = dae.scale.z = 0.05;
    dae.position.y = 1;
    dae.position.x = 100;
    dae.position.z = 100;
    dae.updateMatrix();

    init();
    //animate();

} );




//init();


function init() {


    group = new THREE.Group();
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2( 0xffd1b5, 0.0005 );
    //sprites
    var spriteTexture = new THREE.ImageUtils.loadTexture('images/GrenadeExplosion.png');
    textureAnimator = new TextureAnimator(spriteTexture, 20.5, 1, 10, 75);
    var spriteTextureMaterial = new THREE.MeshBasicMaterial({transparent: true, map: spriteTexture, side:THREE.DoubleSide});
    var spriteTextureGeometry = new THREE.PlaneGeometry(60, 60, 500, 200);

    //camera
    camera.position.set(0,800,300);
    camera.lookAt(scene.position);
    // setup the control gui
    var controls = new function () {
        // we need the first child, since it's a multimaterial
        this.animations = 'crattack';
        this.fps = 10;
    };


    //OGER MODEL


    var loader = new THREE.JSONLoader();
    loader.load('models/ogre/ogro.js', function (geometry, mat) {
        geometry.computeMorphNormals();
        var mat = new THREE.MeshLambertMaterial(
            {
                map: THREE.ImageUtils.loadTexture("models/ogre/skins/skin.jpg"),
                morphTargets: true, morphNormals: true
            });
        ogre = new THREE.MorphAnimMesh(geometry, mat);
        ogre.rotation.y = 0.7;
        ogre.parseAnimations();
        // parse the animations and add them to the control
        var animLabels = [];
        for (var key in ogre.geometry.animations) {
            if (key === 'length' || !ogre.geometry.animations.hasOwnProperty(key)) continue;
            animLabels.push(key);
        }
        /*
        gui.add(controls, 'animations', animLabels).onChange(function (e) {
            //ogre.playAnimation(controls.animations, controls.fps);
        });
        gui.add(controls, 'fps', 1, 20).step(1).onChange(function (e) {
            //ogre.playAnimation(controls.animations, controls.fps);
        });
        */
        ogre.playAnimation('run', 10);
        //ogre.position.x = 100;
        ogre.position.y = 1;
        //ogre.position.z = 250;
        ogre.rotation.y = 55;
        scene.add(ogre);
    });

    var test = new THREE.Mesh(new THREE.CubeGeometry(50, 50, 50), new THREE.MeshNormalMaterial());
    test.position.y = 0;
    scene.add(test);
    targets.push(test);

    //light
    var ambient = new THREE.AmbientLight( 0x111111 );
    scene.add( ambient );

    var directionalLight = new THREE.DirectionalLight( 0xffeedd );
    directionalLight.position.set( 0, 1, 0 );
    scene.add( directionalLight );

    //škatle
    var cubeGeometry = new THREE.CubeGeometry( 40, 40, 40 );
    var crateTexture = new THREE.ImageUtils.loadTexture( 'images/crate.gif' );
    var crateMaterial = new THREE.MeshBasicMaterial( { map: crateTexture } );
    var crate = new THREE.Mesh( cubeGeometry.clone(), crateMaterial );
    crate.position.set(-60, 50, -100);
    scene.add( crate );

    var cube = new THREE.Mesh(new THREE.CubeGeometry(20, 20, 20), new THREE.MeshNormalMaterial({ transparent: true, opacity: 0.0 }));
    var target = new THREE.Mesh(new THREE.CubeGeometry(15, 15, 15), new THREE.MeshNormalMaterial());

    target.position.y = 1;
    cube.position.y = 1;

    //plane

    var texture, material, plane;
    texture = THREE.ImageUtils.loadTexture("images/Test.jpg");
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4,4);
    material = new THREE.MeshLambertMaterial({ map : texture });
    plane = new THREE.Mesh(new THREE.PlaneGeometry(2048, 2048), material);
    plane.material.side = THREE.DoubleSide;
    plane.position.y = 0;
    plane.rotateX(-Math.PI/2);

    scene.add(plane);

    var wall;
    texture = THREE.ImageUtils.loadTexture("images/wall.jpg");
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4,2);
    material = new THREE.MeshLambertMaterial({ map : texture });
    wall = new THREE.Mesh(new THREE.PlaneGeometry(2048, 1024), material);
    wall.material.side = THREE.DoubleSide;
    wall.position.y = 0;

    wall.position.z = -1024;
    scene.add(wall);
    wall1 = new THREE.Mesh(new THREE.PlaneGeometry(2048, 1024), material);
    wall1.material.side = THREE.DoubleSide;
    wall1.position.y = 0;
    wall1.rotateY(-Math.PI/2);
    wall1.position.x = -1024;
    scene.add(wall1);
    wall2 = new THREE.Mesh(new THREE.PlaneGeometry(2048, 1024), material);
    wall2.material.side = THREE.DoubleSide;
    wall2.position.y = 0;
    wall2.rotateY(-Math.PI/2);
    wall2.position.x = 1024;
    scene.add(wall2);



    renderer = new THREE.WebGLRenderer();
    renderer.setSize(WIDTH, HEIGHT);


    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("container").appendChild(renderer.domElement);
    document.onmousemove = handleMouseMove;
    document.onmousedown = handleMouseClick;
// Add the COLLADA

    scene.add(target);
    scene.add(cube);
    spawnEnemy();
    spawnEnemy();
    spawnEnemy();
    camera.lookAt(scene.position);

    animate();

    function keyboardUpdate() {
        //.log(cube.position.z);
        // Cursor up
        if(keyboard.pressed("W")){
            if(cube.position.z > -1000) {
                cube.position.z -= 10;
                ogre.position.z -= 10;
                target.position.z -= 10;
                if(cube.position.z < 500)
                camera.position.z -= 10;w
            }
            // Cursor down
        }
        if(keyboard.pressed("S")){
            if(cube.position.z < 1000) {
                cube.position.z += 10;
                ogre.position.z += 10;
                target.position.z += 10;
                if(cube.position.z < 500)// && cube.position.z > -1000)
                    camera.position.z += 10;
            }
            // Cursor left
        }
        if(keyboard.pressed("A")){
            if(cube.position.x > -1000) {
                cube.position.x -= 10;
                ogre.position.x -= 10;
                target.position.x -= 10;
                camera.position.x -= 10;
            }
            // Cursor right
        }  if(keyboard.pressed("D")){

            if(cube.position.x < 1000) {
                cube.position.x += 10;
                ogre.position.x += 10;
                target.position.x += 10;
                camera.position.x += 10;
            }
        }
        if(keyboard.pressed("space")){
            jump.isJump = true;
        }


    }

    function makeJump(elapsed) {
            if (jump.step < jump.height && jump.isJump) {
                cube.position.y -= elapsed * jump.speed;

                jump.step = cube.position.y;


            }
            else {
                //console.log("else");
                jump.isJump = false;
            }
            if (!(jump.isJump)) {
                if (jump.step < 0) {
                    jump.step = 0;
                    cube.position.y = step;
                }
                else if (jump.step > 0) {
                    cube.position.y += elapsed * jump.speed;
                    //orge.position.y += elapsed * jump.speed;
                    jump.step = cube.position.y;

                }
            }
    }

    function Bullet(mesh, distance, distanceMax) {
        this.mesh = mesh;
        this.distance = distance;
        this.distanceMax = distanceMax;
    }

    function updateBullet() {
        for (var i in bullets) {
            var bullet = bullets[i];
            bullet.mesh.translateZ(5);
            bullet.distance += 5;
            if (bullet.distance > bullet.distanceMax) {
                explosion(bullet.mesh.position.x,bullet.mesh.position.y,bullet.mesh.position.z);
                scene.remove(bullets[i].mesh);
                removeBullet(i);
            }
        }
    }

    function removeBullet(index) {
        if (index > -1) {
            bullets.splice(index, 1);
        }
    }

    function shoot(target_position, distance) {
        var geometry = new THREE.SphereGeometry( 5, 32, 32 );
        var material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
        var sphere = new THREE.Mesh( geometry, material );
        var loadBullet = new Bullet(sphere, 0,distance);
        loadBullet.mesh.position.x = cube.position.x;
        loadBullet.mesh.position.y = cube.position.y;
        loadBullet.mesh.position.z = cube.position.z;
        loadBullet.mesh.lookAt(target_position);
        bullets.push(loadBullet);
        scene.add(loadBullet.mesh);
    }

    function Enemy(mesh){
        this.mesh = mesh;
    }



    function spawnEnemy(){
        var geometry = new THREE.CubeGeometry( 50, 50, 50 );
        var material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
        var enemyMesh = new THREE.Mesh( geometry, material );
        var character = new Enemy(enemyMesh);
        var loc = (Math.random()*10)+1;


        var monster = dae;
        character.mesh.position.y = 1;
        if (loc < 4){
            dae.position.x = 800;
            dae.position.z = 800;
            /*
            character.mesh.position.x = WIDTH;
            character.mesh.position.z = HEIGHT;
            */
        }

        else if (loc >= 4 && loc < 7){
            dae.position.x = -800;
            dae.position.z = 800;
            /*
            character.mesh.position.x = -WIDTH;
            character.mesh.position.z = HEIGHT;
            */
        }
        else{

            dae.position.x = -800;
            dae.position.z = -800;
            /*
            character.mesh.position.x = -WIDTH;
            character.mesh.position.z = -HEIGHT;
            */
        }

        monsters.push(monster)
        scene.add(monster);
        //enemies.push(character);
        //scene.add(character.mesh);

    }

    function updateEnemy(){
        for (var i in monsters) {
            var monster = monsters[i];
            //console.log(monster.position.x+" "+monster.position.z);
            //if (monster.position.x > -1000 && monster.position.x < 1000){
                var x1 = monster.position.x;
            //}
            //if (monster.position.z > -1000 && monster.position.z < 1000) {
                var z1 = monster.position.z;
            //}
                var x2 = cube.position.x;
                var z2 = cube.position.z;
                monster.translateX((x2 - x1) / 1000);
                monster.translateZ((z2 - z1) / 1000);

            monster.lookAt(new THREE.Vector3(cube.position.x, 1, cube.position.z));
            //enemy.mesh.translateX(x2 - x1);
            //enemy.mesh.translateZ(z2 - z1);
            //enemy.mesh.lookAt(cube);

            /*
             for (var i in enemies){
             var enemy = enemies[i];
             var x1 = enemy.mesh.position.x;
             var z1 = enemy.mesh.position.z;
             var x2 = cube.position.x;
             var z2 = cube.position.z;
             enemy.mesh.translateX((x2-x1)/240+Math.random()*3/24);
             enemy.mesh.translateZ((z2-z1)/240-Math.random()*2/30);
             enemy.mesh.lookAt(new THREE.Vector3(cube.position.x,1,cube.position.z));
             //enemy.mesh.translateX(x2 - x1);
             //enemy.mesh.translateZ(z2 - z1);
             //enemy.mesh.lookAt(cube);
             }
             */
        }
    }

    function Explosion(mesh,timeToLive) {
        this.mesh = mesh;
        this.timeToLive = timeToLive;
    }

    function explosion(x,y,z) {
        sprite = new THREE.Mesh(spriteTextureGeometry, spriteTextureMaterial);
        sprite.position.set(x,y,z);
        sprite.rotateX(-64);
        explosions.push(new Explosion(sprite, new Date().getTime()));
        group.add(sprite);
        scene.add(sprite);
    }

    function updateExplosion() {
        var elapsed;
        for (var i in explosions) {
            elapsed =  new Date().getTime() - explosions[i].timeToLive;
            if (elapsed > 600) {
                scene.remove(explosions[i].mesh);
                group.remove(explosions[i].mesh)
                removeExplosion(i);
            }
        }
    }

    function removeExplosion(index) {
        if (index > -1) {
            explosions.splice(index, 1);
        }
    }


	function handleMouseClick(event){
        //ogre.playAnimation('attack', 10);
		var mouse3D = new THREE.Vector3(
            (event.clientX/window.innerWidth)*2-1,
            -(event.clientY/window.innerHeight)*2+1,
            1
        );
        projector.unprojectVector(mouse3D,camera);

        var distance = target.position.subVectors(camera.position,target.position);
        var target_position = camera.position.clone();
        target_position = target_position.addVectors(target_position,mouse3D.subVectors(mouse3D,camera.position).normalize().multiplyScalar(distance.length()));

        var distance2 = target_position.length();
        shoot(target_position, distance2);

        //ogre.playAnimation('stand', 10);
	}

    function handleMouseMove(event) {
        var v = new THREE.Vector3(
            (event.clientX/window.innerWidth)*2-1,
            -(event.clientY/window.innerHeight)*2+1,
            1
        );
        projector.unprojectVector(v,camera);

        var dist = target.position.subVectors(camera.position,target.position),
            pos = camera.position.clone();
        pos = pos.addVectors(pos,v.subVectors(v,camera.position).normalize().multiplyScalar(dist.length()));
        //pos = pos.add(pos,v.normalize().multiplyScalar(dist.length()));
		
		//koordinate male kocke na ravnini pozicija miške - (ne na zaslonu)
        target.position.x = pos.x;
        target.position.y = 1;
        target.position.z = pos.z;

        cube.lookAt(pos);
        //ogre.lookAt(pos);

        /*
        projector.unprojectVector(vector, camera);
        var dir = vector.sub(camera.position ).normalize();
        var distance = camera.position.y / dir.y;
        var pos = camera.position.clone().add( dir.multiplyScalar( distance ) );



        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = ( event.clientY / window.innerHeight ) * 2 + 1;
        var pos = new THREE.Vector3();

        //toMousePos.normalize();
        cube.lookAt(pos);
        */


    }

    function collisionDetection() {

        var originPoint = target.position.clone();
        for (var vertexIndex = 0; vertexIndex < target.geometry.vertices.length; vertexIndex++)
        {
            var localVertex = target.geometry.vertices[vertexIndex].clone();
            var globalVertex = localVertex.applyMatrix4(target.matrix );
            var directionVector = globalVertex.sub(target.position );

            var ray = new THREE.Raycaster( originPoint, directionVector.clone().normalize() );
            var collisionResults = ray.intersectObjects(targets);
            if ( collisionResults.length > 0 && collisionResults[0].distance < directionVector.length() )
                explosion(target.position.x,target.position.y,target.position.z);
        }
    }

        function animate() {
            //rekurzivni klic
            requestAnimationFrame(function () {
                animate();
            });
            var timeNow = new Date().getTime();
            var elapsed = lastTime - timeNow;
            var delta = clock.getDelta();

            textureAnimator.update(delta*1000);

            //annie.update(1000*delta);

            // animate Collada model

            THREE.AnimationHandler.update( delta );

            if ( morphs.length ) {

                for ( var i = 0; i < morphs.length; i ++ )
                    morphs[ i ].updateAnimation( 1000 * delta );

            }
            if (ogre) {
                //            mesh.rotation.x+=0.006;
//                mesh.rotation.y+=0.006;
                if (ogre) {
                    ogre.updateAnimation(delta * 1000);
                    //ogre.rotation.y+=0.005;
                }
            }

            updateEnemy();
            keyboardUpdate();
            updateBullet();
            updateExplosion();
            makeJump(elapsed);
            collisionDetection();
            renderer.render(scene, camera);


            //render();
            // request new frame

            lastTime = timeNow;
    }
}

function TextureAnimator( texture, tilesHoriz, tilesVert, numTiles, tileDispDuration) {
    // note: texture passed by reference, will be updated by the update function.

    this.tilesHorizontal = tilesHoriz;
    this.tilesVertical = tilesVert;
    // how many images does this spritesheet contain?
    //  usually equals tilesHoriz * tilesVert, but not necessarily,
    //  if there at blank tiles at the bottom of the spritesheet.
    this.numberOfTiles = numTiles;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 1 / this.tilesHorizontal, 1 / this.tilesVertical );

    // how long should each image be displayed?
    this.tileDisplayDuration = tileDispDuration;

    // how long has the current image been displayed?
    this.currentDisplayTime = 0;

    // which image is currently being displayed?
    this.currentTile = 0;

    this.update = function( milliSec )
    {
        this.currentDisplayTime += milliSec;
        while (this.currentDisplayTime > this.tileDisplayDuration)
        {
            this.currentDisplayTime -= this.tileDisplayDuration;
            this.currentTile++;
            if (this.currentTile == this.numberOfTiles)
                this.currentTile = 0;
            var currentColumn = this.currentTile % this.tilesHorizontal;
            texture.offset.x = currentColumn / this.tilesHorizontal;
            var currentRow = Math.floor( this.currentTile / this.tilesHorizontal );
            texture.offset.y = currentRow / this.tilesVertical;
        }

    };


}
