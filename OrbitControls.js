
// OrbitControls.js - r110 compatible version (fixed inverse issue)
// Full source: https://github.com/mrdoob/three.js/blob/r110/examples/js/controls/OrbitControls.js

THREE.OrbitControls = function ( object, domElement ) {
    this.object = object;
    this.domElement = ( domElement !== undefined ) ? domElement : document;

    this.enabled = true;
    this.target = new THREE.Vector3();

    this.minDistance = 0;
    this.maxDistance = Infinity;

    this.minZoom = 0;
    this.maxZoom = Infinity;

    this.minPolarAngle = 0;
    this.maxPolarAngle = Math.PI;

    this.minAzimuthAngle = - Infinity;
    this.maxAzimuthAngle = Infinity;

    this.enableDamping = false;
    this.dampingFactor = 0.25;

    this.enableZoom = true;
    this.zoomSpeed = 1.0;

    this.enableRotate = true;
    this.rotateSpeed = 1.0;

    this.enablePan = true;
    this.keyPanSpeed = 7.0;

    this.autoRotate = false;
    this.autoRotateSpeed = 2.0;

    this.enableKeys = true;
    this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };

    this.mouseButtons = { ORBIT: THREE.MOUSE.LEFT, ZOOM: THREE.MOUSE.MIDDLE, PAN: THREE.MOUSE.RIGHT };

    var scope = this;
    var changeEvent = { type: 'change' };
    var STATE = { NONE : - 1, ROTATE : 0, DOLLY : 1, PAN : 2 };
    var state = STATE.NONE;

    var spherical = new THREE.Spherical();
    var sphericalDelta = new THREE.Spherical();
    var scale = 1;
    var panOffset = new THREE.Vector3();
    var zoomChanged = false;

    this.update = function() {
        var offset = new THREE.Vector3();
        var quat = new THREE.Quaternion().setFromUnitVectors( object.up, new THREE.Vector3( 0, 1, 0 ) );
        var quatInverse = quat.clone().invert(); // ✅ fixed: use invert() instead of inverse()

        var position = scope.object.position;
        offset.copy( position ).sub( scope.target );
        offset.applyQuaternion( quat );
        spherical.setFromVector3( offset );

        spherical.theta += sphericalDelta.theta;
        spherical.phi += sphericalDelta.phi;
        spherical.makeSafe();

        spherical.radius *= scale;
        spherical.radius = Math.max( scope.minDistance, Math.min( scope.maxDistance, spherical.radius ) );

        scope.target.add( panOffset );
        offset.setFromSpherical( spherical );
        offset.applyQuaternion( quatInverse );
        position.copy( scope.target ).add( offset );

        scope.object.lookAt( scope.target );
        sphericalDelta.set( 0, 0, 0 );
        scale = 1;
        panOffset.set( 0, 0, 0 );
        zoomChanged = false;
        scope.dispatchEvent( changeEvent );
    };

    this.update();
};

THREE.OrbitControls.prototype = Object.create( THREE.EventDispatcher.prototype );
THREE.OrbitControls.prototype.constructor = THREE.OrbitControls;
