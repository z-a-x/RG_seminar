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

function Bullet(mesh, distance, distanceMax) {
    this.mesh = mesh;
    this.distance = distance;
    this.distanceMax = distanceMax;
}

function Explosion(mesh,timeToLive) {
    this.mesh = mesh;
    this.timeToLive = timeToLive;
}

var bullets = new Array();
var explosions = new Array();

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

init();

function init() {
    group = new THREE.Group();
    scene = new THREE.Scene();
    var spriteTexture = new THREE.ImageUtils.loadTexture('images/GrenadeExplosion.png');
    textureAnimator = new TextureAnimator(spriteTexture, 20.5, 1, 10, 75);
    var spriteTextureMaterial = new THREE.MeshBasicMaterial({transparent: true, map: spriteTexture, side:THREE.DoubleSide});
    var spriteTextureGeometry = new THREE.PlaneGeometry(60, 60, 500, 200);

    camera.position.set(0,800,300);
    camera.lookAt(scene.position);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(WIDTH, HEIGHT);

    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("container").appendChild(renderer.domElement);
    document.onmousemove = handleMouseMove;
	document.onmousedown = handleMouseClick;

    var size = 200, step = 10;
    var geometry = new THREE.Geometry();
    var material = new THREE.LineBasicMaterial({color: 'white'});

    for (var i = -size; i <= size; i += step) {
        geometry.vertices.push(new THREE.Vector3(-size, -0.04, i));
        geometry.vertices.push(new THREE.Vector3(size, -0.04, i));
        geometry.vertices.push(new THREE.Vector3(i, -0.04, -size));
        geometry.vertices.push(new THREE.Vector3(i, -0.04, size));
    }

    var line = new THREE.Line(geometry, material, THREE.LinePieces);
    scene.add(line);

    var cube = new THREE.Mesh(new THREE.CubeGeometry(50, 50, 50), new THREE.MeshNormalMaterial());
    var target = new THREE.Mesh(new THREE.CubeGeometry(15, 15, 15), new THREE.MeshNormalMaterial());

    target.position.y = 1;
    cube.position.y = 1;

    scene.add(target);
    scene.add(cube);
    camera.lookAt(scene.position);
    animate();

    function keyboardUpdate() {
        // Cursor up
        if(keyboard.pressed("W")){
            cube.position.z -= 10;
            target.position.z -= 10;
            camera.position.z -=10;
            // Cursor down
        }  if(keyboard.pressed("S")){
            cube.position.z += 10;
            target.position.z += 10;
            camera.position.z +=10;
            // Cursor left
        }  if(keyboard.pressed("A")){
            cube.position.x -= 10;
            target.position.x -= 10;
            camera.position.x -=10;
            // Cursor right
        }  if(keyboard.pressed("D")){
            cube.position.x += 10;
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
                console.log(cube.position.y);
            }
            else {
                console.log("else");
                jump.isJump = false;
            }
            if (!(jump.isJump)) {
                if (jump.step < 0) {
                    jump.step = 0;
                    cube.position.y = step;
                }
                else if (jump.step > 0) {
                    cube.position.y += elapsed * jump.speed;
                    jump.step = cube.position.y;
                }
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

    function removeBullet(index) {
        if (index > -1) {
            bullets.splice(index, 1);
        }
    }

    function removeExplosion(index) {
        if (index > -1) {
            explosions.splice(index, 1);
        }
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
        //pos.addVectors(toMousePos,cube.position);
        cube.lookAt(pos);
        */

        //target.position.x = cube.position.x;
        //target.position.z = cube.position.y;

    }

        function animate() {
            var timeNow = new Date().getTime();
            var elapsed = lastTime - timeNow;
            var delta = clock.getDelta();

            textureAnimator.update(delta*1000);

            //annie.update(1000*delta);

            keyboardUpdate();
            updateBullet();
            updateExplosion();
            makeJump(elapsed);
            renderer.render(scene, camera);
            // request new frame
            requestAnimationFrame(function () {
                animate();
            });
            lastTime = timeNow;
    }



}
function TextureAnimator( texture, tilesHoriz, tilesVert, numTiles, tileDispDuration)
{
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