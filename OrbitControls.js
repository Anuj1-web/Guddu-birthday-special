
/**
 * @author three.js
 * @version r152 compatible OrbitControls
 */

THREE.OrbitControls = function ( object, domElement ) {

	this.object = object;
	this.domElement = ( domElement !== undefined ) ? domElement : document;

	// API
	this.enabled = true;
	this.target = new THREE.Vector3();
	this.minDistance = 0;
	this.maxDistance = Infinity;
	this.minZoom = 0;
	this.maxZoom = Infinity;
	this.minPolarAngle = 0; // radians
	this.maxPolarAngle = Math.PI; // radians
	this.minAzimuthAngle = - Infinity; // radians
	this.maxAzimuthAngle = Infinity; // radians
	this.enableDamping = false;
	this.dampingFactor = 0.05;
	this.enableZoom = true;
	this.zoomSpeed = 1.0;
	this.enableRotate = true;
	this.rotateSpeed = 1.0;
	this.enablePan = true;
	this.panSpeed = 1.0;
	this.keyPanSpeed = 7.0;
	this.autoRotate = false;
	this.autoRotateSpeed = 2.0;
	this.enableKeys = true;
	this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };
	this.mouseButtons = { ORBIT: THREE.MOUSE.LEFT, ZOOM: THREE.MOUSE.MIDDLE, PAN: THREE.MOUSE.RIGHT };

	// internals
	var scope = this;
	var changeEvent = { type: 'change' };
	var state = STATE.NONE;
	var EPS = 0.000001;
	var spherical = new THREE.Spherical();
	var sphericalDelta = new THREE.Spherical();
	var scale = 1;
	var panOffset = new THREE.Vector3();
	var zoomChanged = false;

	var rotateStart = new THREE.Vector2();
	var rotateEnd = new THREE.Vector2();
	var rotateDelta = new THREE.Vector2();
	var panStart = new THREE.Vector2();
	var panEnd = new THREE.Vector2();
	var panDelta = new THREE.Vector2();
	var dollyStart = new THREE.Vector2();
	var dollyEnd = new THREE.Vector2();
	var dollyDelta = new THREE.Vector2();

	var STATE = { NONE : - 1, ROTATE : 0, DOLLY : 1, PAN : 2, TOUCH_ROTATE : 3, TOUCH_DOLLY : 4, TOUCH_PAN : 5 };

	// Quaternion helpers
	var quat = new THREE.Quaternion().setFromUnitVectors( object.up, new THREE.Vector3( 0, 1, 0 ) );
	var quatInverse = quat.clone().invert();

	this.update = function () {

		var offset = new THREE.Vector3();
		var position = scope.object.position;
		offset.copy( position ).sub( scope.target );
		offset.applyQuaternion( quat );
		spherical.setFromVector3( offset );

		if ( scope.autoRotate && state === STATE.NONE ) {
			rotateLeft( getAutoRotationAngle() );
		}

		spherical.theta += sphericalDelta.theta;
		spherical.phi += sphericalDelta.phi;

		spherical.theta = Math.max( scope.minAzimuthAngle, Math.min( scope.maxAzimuthAngle, spherical.theta ) );
		spherical.phi = Math.max( scope.minPolarAngle, Math.min( scope.maxPolarAngle, spherical.phi ) );
		spherical.makeSafe();

		spherical.radius *= scale;
		spherical.radius = Math.max( scope.minDistance, Math.min( scope.maxDistance, spherical.radius ) );

		scope.target.add( panOffset );

		offset.setFromSpherical( spherical );
		offset.applyQuaternion( quatInverse );

		position.copy( scope.target ).add( offset );
		scope.object.lookAt( scope.target );

		if ( scope.enableDamping ) {
			sphericalDelta.theta *= ( 1 - scope.dampingFactor );
			sphericalDelta.phi *= ( 1 - scope.dampingFactor );
		} else {
			sphericalDelta.set( 0, 0, 0 );
		}

		scale = 1;
		panOffset.set( 0, 0, 0 );

		scope.dispatchEvent( changeEvent );
	};

	function getAutoRotationAngle() {
		return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;
	}

	function rotateLeft( angle ) {
		sphericalDelta.theta -= angle;
	}

	function rotateUp( angle ) {
		sphericalDelta.phi -= angle;
	}

	// more functions (pan, dolly, mouse/touch handlers) would continue here...
};

THREE.OrbitControls.prototype = Object.create( THREE.EventDispatcher.prototype );
THREE.OrbitControls.prototype.constructor = THREE.OrbitControls;
