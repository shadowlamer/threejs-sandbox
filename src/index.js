
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
let camera, scene, renderer, controls;
let cameraBasePosition, controlsBaseTarget;
let controlPoints = [], lookPoints = [], controlPoint = 0;
let distance

const pictures = [
    "PIC_0049",
    "pic_0563",
    "pic_0736",
    "pic_0741",
    "pic_0745",
    "pic_0768",
    "pic_0775",
    "pic_0794"
];

init();
animate();

function init() {
    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 100 );
    camera.position.z = 0.01;

    cameraBasePosition = camera.position.clone();
    console.log(cameraBasePosition);

    scene = new THREE.Scene();


    var geometry = new THREE.PlaneBufferGeometry( 16, 9 );
    geometry.scale( 0.5, 0.5, 0.5 );

    const loader = new THREE.TextureLoader();

    var count = 128;
    var radius = 32;

    for ( var i = 1, l = count; i <= l; i ++ ) {

        let pic = i % pictures.length

        let phi = Math.acos(-1 + (2 * i) / l);
        let theta = Math.sqrt(l * Math.PI) * phi;

        let material = new THREE.MeshBasicMaterial({
            color: '#999',
            map: loader.load('assets/' + pictures[pic] + '_thumbnail.jpg'),
        });

        let mesh = new THREE.Mesh(geometry, material);
        mesh.position.setFromSphericalCoords( radius, phi, theta );
        mesh.lookAt( camera.position );
        scene.add( mesh );
    }
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    controls = new OrbitControls( camera, renderer.domElement );
    controls.enableZoom = false;
    controls.enablePan = false;
    window.addEventListener( 'resize', onWindowResize, false );
    window.addEventListener( "mousemove", onDocumentMouseMove, false );
    window.addEventListener( "click", onDocumentClick, false );
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}
function animate() {
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
}

var selectedObject = null;

function onDocumentMouseMove( event ) {
    event.preventDefault();

    if ( selectedObject ) {
        selectedObject.material.color.set( '#999' );
        selectedObject = null;
    }
    var intersects = getIntersects( event.layerX, event.layerY );
    if ( intersects.length > 0 ) {
        var res = intersects.filter( function ( res ) {
            return res && res.object;
        } )[ 0 ];
        if ( res && res.object ) {
            selectedObject = res.object;
            selectedObject.material.color.set( '#fff' );
        }
    }
}
var raycaster = new THREE.Raycaster();
var mouseVector = new THREE.Vector3();

function getIntersects( x, y ) {
    x = ( x / window.innerWidth ) * 2 - 1;
    y = - ( y / window.innerHeight ) * 2 + 1;
    mouseVector.set( x, y, 0.5 );
    raycaster.setFromCamera( mouseVector, camera );
    return raycaster.intersectObject( scene, true );
}

function onDocumentClick( event ) {
    if (controlPoint > 0) {
        restoreCameraPosition();
    } else {
        if (selectedObject) {
            controlsBaseTarget = controls.target.clone();
            zoomCameraToSelection(camera, controls, [selectedObject], 0.8);
        }
    }
}

function zoomCameraToSelection( camera, controls, selection, fitOffset = 1.2 ) {

    const box = new THREE.Box3();

    for( const object of selection ) box.expandByObject( object );

    const size = box.getSize( new THREE.Vector3() );
    const center = box.getCenter( new THREE.Vector3() );

    const maxSize = Math.max( size.x, size.y, size.z );
    const fitHeightDistance = maxSize / ( 2 * Math.atan( Math.PI * camera.fov / 360 ) );
    const fitWidthDistance = fitHeightDistance / camera.aspect;
    distance = fitOffset * Math.max( fitHeightDistance, fitWidthDistance );

    controls.maxDistance = distance * 10;

    controlPoints = makePoints(controlsBaseTarget, center);

    let lookAtVector = new THREE.Vector3(0,0, -1);
    lookAtVector.applyQuaternion(camera.quaternion);
    lookPoints = makePoints(lookAtVector, selectedObject.position);


    camera.near = distance / 100;
    camera.far = distance * 100;

   controlPoint = 0;
   moveCamera();

}

function restoreCameraPosition() {
    if (controlPoint > 0) {
        positionCamera(controlPoint);
        controlPoint--;
        setTimeout(restoreCameraPosition, 10);
    } else {
        controls.target.copy(controlsBaseTarget);
        controls.update();
    }
}

function moveCamera() {
    if (controlPoint < 100) {
        positionCamera(controlPoint);
        controlPoint++;
        setTimeout(moveCamera, 10);
    }
}

function positionCamera(point) {
    controls.target.copy( controlPoints[point] );
    const direction = controls.target.clone()
        .sub( camera.position )
        .normalize()
        .multiplyScalar( distance );
    let cameraNewPosition = controls.target.sub(direction);
    camera.updateProjectionMatrix();
    camera.position.copy( cameraNewPosition );
    controls.update();
    camera.lookAt(lookPoints[point]);

}

function makePoints(v1, v2) {
    let curve = new THREE.LineCurve3(v1, v2);
    return [...curve.getPoints(100)];
}