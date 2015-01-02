// scene
var container;
var camera, scene, renderer;

// intersect with objects in this array
var intersectObjects    = [];

// materials
var material = new THREE.MeshNormalMaterial();
var cristal_texture = new THREE.MeshLambertMaterial({ map: THREE.ImageUtils.loadTexture("models/JSON/textures/cristal.jpg") });
var destination;

init();
animate();


function init() {

    container = document.createElement( 'div' );
    document.body.appendChild( container );

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 15000 );
    camera.rotation.x = - 90 * ( Math.PI / 180 );
    camera.position.set( 800 , 1000 , 0 );

    scene = new THREE.Scene();

    plane = new THREE.Mesh( new THREE.PlaneGeometry( 3000, 3000 ), new THREE.MeshBasicMaterial( { color: 0xe0e0e0 } ) );
    plane.rotation.x = - 90 * ( Math.PI / 180 );
    plane.position.set(0,0,0);
    plane.overdraw = true;
    scene.add( plane );
    intersectObjects.push(plane);

    loader = new THREE.JSONLoader();
    loader.load( "models/JSON/driller.js", function( geometry ) {
        driller = new THREE.Mesh( geometry, material );
        driller.position.set(0,50,0);
        matr = new THREE.Matrix4();
        driller.matrixAutoUpdate = false;
        driller.geometry.applyMatrix( matr.makeRotationY( 0 ) );
        driller.scale.set(0.5,0.5,0.5);
        scene.add( driller );
    });

    loade = new THREE.JSONLoader();
    loade.load( "models/JSON/cristal.js", function( geometry ) {
        cristal = new THREE.Mesh( geometry, cristal_texture );
        cristal.position.set(-1450,0,1450);
        matre = new THREE.Matrix4();
        cristal.matrixAutoUpdate = false;
        cristal.geometry.applyMatrix(matre.makeRotationY( 0 ));
        cristal.scale.set(0.5,0.5,0.5);
        scene.add( cristal );
        intersectObjects.push(plane);
    });

    // lightning properties
    var ambientLight = new THREE.AmbientLight(0xFFFFFF);
    scene.add(ambientLight);
    scene.matrixAutoUpdate = false;

    // render engine
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.sortObjects = false;
    container.appendChild( renderer.domElement );

    // event listeners
    document.addEventListener('mouseup', onMouseUp, false);


}

function onMouseUp(event) {

    event.preventDefault();
    x_pos = (event.clientX / window.innerWidth) * 2 - 1;
    y_pos = -(event.clientY / window.innerHeight) * 2 + 1;
    z_pos = 0.5;

    var vector = new THREE.Vector3( x_pos , y_pos , z_pos );

    var projector = new THREE.Projector();
    projector.unprojectVector(vector, camera);
    var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
    var intersects = raycaster.intersectObjects(intersectObjects);

    if (intersects.length > 0) {

        xp = intersects[0].point.x.toFixed(2);
        yp = intersects[0].point.y.toFixed(2);
        zp = intersects[0].point.z.toFixed(2);
        destination = new THREE.Vector3( xp , 50 , zp );

        var se23k = Math.random() * 4 * 4 ;
        new TWEEN.Tween( driller.rotation ).to( { y: se23k }, 1000 ).easing( TWEEN.Easing.Linear.None).start();

    }

    else {
        console.log('outside boundaries');
    }

};

function update(){

    camera.lookAt( plane.position );
    renderer.render( scene, camera );
}

function animate() {

    requestAnimationFrame( animate );
    update();
    render();
}

function render() {
    driller.updateMatrix();
    cristal.updateMatrix();

    TWEEN.update();
    renderer.render( scene, camera );
}/**
 * Created by Fun on 15/12/2014.
 */
