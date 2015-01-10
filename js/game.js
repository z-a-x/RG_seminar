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


var android;
var dae;
var morphs = [];


// Collada model
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

    function initStats() {
        var stats = new Stats();
        stats.setMode(0); // 0: fps, 1: ms
        // Align top-left
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.left = '0px';
        stats.domElement.style.top = '0px';
        $("#Stats-output").append(stats.domElement);
        return stats;
    }
    ////////////////////////
    var stats = initStats();
    ////////////////////////
    group = new THREE.Group();
    scene = new THREE.Scene();

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
    }
    var gui = new dat.GUI();
    var mesh;
    var clock = new THREE.Clock();
    var loader = new THREE.JSONLoader();
    loader.load('models/ogre/ogro.js', function (geometry, mat) {
        geometry.computeMorphNormals();
        var mat = new THREE.MeshLambertMaterial(
            {
                map: THREE.ImageUtils.loadTexture("models/ogre/skins/skin.jpg"),
                morphTargets: true, morphNormals: true
            });
        mesh = new THREE.MorphAnimMesh(geometry, mat);
        mesh.rotation.y = 0.7;
        mesh.parseAnimations();
        // parse the animations and add them to the control
        var animLabels = [];
        for (var key in mesh.geometry.animations) {
            if (key === 'length' || !mesh.geometry.animations.hasOwnProperty(key)) continue;
            animLabels.push(key);
        }
        gui.add(controls, 'animations', animLabels).onChange(function (e) {
            mesh.playAnimation(controls.animations, controls.fps);
        });
        gui.add(controls, 'fps', 1, 20).step(1).onChange(function (e) {
            mesh.playAnimation(controls.animations, controls.fps);
        });
        mesh.playAnimation('crattack', 10);
        mesh.position.x = 100;
        mesh.position.y = 1;
        mesh.position.z = 250;
        scene.add(mesh);
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



    var cube = new THREE.Mesh(new THREE.CubeGeometry(50, 50, 50), new THREE.MeshNormalMaterial());
    var target = new THREE.Mesh(new THREE.CubeGeometry(15, 15, 15), new THREE.MeshNormalMaterial());

    target.position.y = 1;
    cube.position.y = 1;

    //plane

    var texture, material, plane;
    texture = THREE.ImageUtils.loadTexture("images/Cracked_Ground_Texture_by_Tusserte.jpg");
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1,1);
    material = new THREE.MeshLambertMaterial({ map : texture });
    plane = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), material);
    plane.material.side = THREE.DoubleSide;
    plane.position.y = 0;

    plane.rotateX(-Math.PI/2);

    scene.add(plane);


    //var jsonLoader = new THREE.JSONLoader();
    //jsonLoader.load( "models/walk.js", addModelToScene );

    // init loading
    function addModelToScene( geometry, materials ) {
        // for preparing animation
        /*
        for (var i = 0; i < materials.length; i++)
            materials[i].morphTargets = true;
         */
        android = new THREE.Mesh( geometry, material );
        android.traverse( function (child) {
            if ( android instanceof THREE.Mesh ) {
                android.material.map = THREE.ImageUtils.loadTexture( '../textures/Zombie_specular.png');
                //android.material.needsUpdate = true;
            }

        });

        android.position.y = 1;
        android.position.x = 0;
        android.position.z = 0;
        android.scale.set(30,30,30);
        scene.add( android );
    }

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
        // Cursor up
        if(keyboard.pressed("W")){
            cube.position.z -= 10;
            //android.position.z -= 10;
            target.position.z -= 10;
            camera.position.z -=10;
            // Cursor down
        }  if(keyboard.pressed("S")){
            cube.position.z += 10;
            //android.position.z += 10;
            target.position.z += 10;
            camera.position.z +=10;
            // Cursor left
        }  if(keyboard.pressed("A")){
            cube.position.x -= 10;
            //android.position.x -= 10;
            target.position.x -= 10;
            camera.position.x -=10;
            // Cursor right
        }  if(keyboard.pressed("D")){
            cube.position.x += 10;
            //android.position.x += 10;
            target.position.x += 10;
            camera.position.x +=10;
        }
        if(keyboard.pressed("space")){
            jump.isJump = true;
        }

    }

    function makeJump(elapsed) {
            if (jump.step < jump.height && jump.isJump) {
                cube.position.y -= elapsed * jump.speed;
                jump.step = cube.position.y;
                //android.position.y -= elapsed * jump.speed;
                //jump.step = android.position.y;
                //console.log(android.position.y);
            }
            else {
                //console.log("else");
                jump.isJump = false;
            }
            if (!(jump.isJump)) {
                if (jump.step < 0) {
                    jump.step = 0;
                    cube.position.y = step;
                    //android.position.y = step;
                }
                else if (jump.step > 0) {
                    cube.position.y += elapsed * jump.speed;
                    jump.step = cube.position.y;
                    //android.position.y += elapsed * jump.speed;
                    //jump.step = android.position.y;
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
        //loadBullet.mesh.position.x = android.position.x;
        //loadBullet.mesh.position.y = android.position.y;
        //loadBullet.mesh.position.z = android.position.z;
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
            dae.position.x = WIDTH;
            dae.position.z = WIDTH;
            /*
            character.mesh.position.x = WIDTH;
            character.mesh.position.z = HEIGHT;
            */
        }

        else if (loc >= 4 && loc < 7){
            dae.position.x = -WIDTH;
            dae.position.z = WIDTH;
            /*
            character.mesh.position.x = -WIDTH;
            character.mesh.position.z = HEIGHT;
            */
        }
        else{

            dae.position.x = -WIDTH;
            dae.position.z = -WIDTH;
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
            var x1 = monster.position.x;
            var z1 = monster.position.z;
            var x2 = cube.position.x;
            var z2 = cube.position.z;
            //var x2 = android.position.x;
            //var z2 = android.position.z;
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
             //var x2 = android.position.x;
             //var z2 = android.position.z;
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

        /*
        projector.unprojectVector(vector, camera);
        var dir = vector.sub(camera.position ).normalize();
        var distance = camera.position.y / dir.y;
        var pos = camera.position.clone().add( dir.multiplyScalar( distance ) );



        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = ( event.clientY / window.innerHeight ) * 2 + 1;
        var pos = new THREE.Vector3();

        //toMousePos.normalize();
        //pos.addVectors(toMousePos,android.position);
        cube.lookAt(pos);
        */

        //target.position.x = android.position.x;
        //target.position.z = android.position.y;

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
            if (mesh) {
                //            mesh.rotation.x+=0.006;
//                mesh.rotation.y+=0.006;
                if (mesh) {
                    mesh.updateAnimation(delta * 1000);
                    //    mesh.rotation.y+=0.01;
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
