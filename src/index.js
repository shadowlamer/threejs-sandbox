
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const maxPoints = 50;
const zoomTime = 500;
const viewDistance = 4;

let camera, scene, renderer, controls;
let cameraBasePosition, controlsBaseTarget;
let controlPoints = [], lookPoints = [], controlPoint = 0;
let distance;
let zoomedObject;
let selectedObject = null;

const loader = new THREE.TextureLoader();

const pictures = [
    "PIC_0049",
    "pic_0563",
    "pic_0736",
    "pic_0741",
    "pic_0745",
    "pic_0768",
    "pic_0775",
    "pic_0794",
    "oksana",
    "maria",
    "book"
];

let objects=[];

init();
animate();

function init() {
    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 100 );
    camera.position.z = 0.01;

    cameraBasePosition = camera.position.clone();

    scene = new THREE.Scene();


    var geometry = new THREE.PlaneBufferGeometry( 7, 7 );

    var count = 128;
    var radius = 32;

    for ( var i = 1, l = count; i <= l; i ++ ) {

        let pic = i % pictures.length

        let phi = Math.acos(-1 + (2 * i) / l);
        let theta = Math.sqrt(l * Math.PI) * phi;

        let g = geometry.clone();

        let mesh = new THREE.Mesh(g, getImageMaterial(pictures[pic], true, (tex) => {
            let w = tex.image.width;
            let h = tex.image.height;
            g.scale((w < h ? w / h : 1), (w < h ? 1 : h / w), 1);
        }));

        mesh.position.setFromSphericalCoords( radius, phi, theta );
        mesh.lookAt( camera.position );
        scene.add( mesh );

        objects.push({
            image: pictures[pic],
            object: mesh
        })
    }

    // let directionalLight = new THREE.DirectionalLight( 0xffffff, 10 );
    // directionalLight.position.set( 10, 10, 10 );
    // scene.add( directionalLight );

    let urls = genCubeUrls( 'textures/dark-s_', '.jpg' );

    new THREE.CubeTextureLoader().load( urls, function ( cubeTexture ) {
        cubeTexture.encoding = THREE.sRGBEncoding;
        scene.background = cubeTexture;
    } );


    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    const color = 0x000010;
    const density = 0.03;
    scene.fog = new THREE.FogExp2(color, density);

    controls = new OrbitControls( camera, renderer.domElement );
    controls.enableZoom = false;
    controls.enablePan = false;
    window.addEventListener( 'resize', onWindowResize, false );
    window.addEventListener( "mousemove", onDocumentMouseMove, false );
    window.addEventListener( "click", onDocumentClick, false );
}

function getImageMaterial(image, thumbnail = true, lambda) {
    let imagePath = 'assets/' + image + (thumbnail ? '_thumbnail' : '') + '.jpg';
    let material =  new THREE.MeshBasicMaterial({
        color: '#999',
        map: loader.load(imagePath, lambda)
    });
    material.color.set( thumbnail ? '#999' : '#fff' );
    return material;
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

function onDocumentMouseMove( event ) {
    event.preventDefault();

    if ( selectedObject && !zoomedObject ) {
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
            zoomedObject = objects.find(obj => obj.object === selectedObject);
            zoomedObject.object.material.copy(getImageMaterial(zoomedObject.image, false));
            controlsBaseTarget = controls.target.clone();
            zoomCameraToSelection(camera, controls, selectedObject);
        }
    }
}

function zoomCameraToSelection( camera, controls, selection) {
    let planeDirection = selection.getWorldDirection().clone();
    let endPoint = selection.position.clone().add(planeDirection.multiplyScalar(viewDistance));
    let lookPoint = cameraBasePosition.clone().add(camera.getWorldDirection());
    controlPoints = makePoints(cameraBasePosition, endPoint);
    lookPoints = makePoints(lookPoint, selection.position);
    moveCamera();
}

function restoreCameraPosition() {
    if (controlPoint > 0) {
        positionCamera(controlPoint);
        controlPoint--;
        setTimeout(restoreCameraPosition, zoomTime / maxPoints);
    } else {
        camera.position.copy(cameraBasePosition);
        controls.target.copy(lookPoints[0]);
        controls.update();
        zoomedObject.object.material.copy(getImageMaterial(zoomedObject.image, true));
        zoomedObject = undefined;
    }
}

function moveCamera() {
    if (controlPoint < maxPoints) {
        positionCamera(controlPoint);
        controlPoint++;
        setTimeout(moveCamera, zoomTime / maxPoints);
    }
}

function positionCamera(point) {
    camera.position.copy(controlPoints[point]);
    controls.target.copy(lookPoints[point]);
    camera.lookAt(lookPoints[point]);
    controls.update();
}

function makePoints(v1, v2) {
    let curve = new THREE.LineCurve3(v1, v2);
    return [...curve.getPoints(maxPoints)];
}

function genCubeUrls  ( prefix, postfix ) {
    return [
        prefix + 'px' + postfix, prefix + 'nx' + postfix,
        prefix + 'py' + postfix, prefix + 'ny' + postfix,
        prefix + 'pz' + postfix, prefix + 'nz' + postfix
    ];
}
