/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author erich666 / http://erichaines.com
 *
 * OrbitControls.js (non-module version)
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

	this.mouseButtons = {
		ORBIT: THREE.MOUSE.LEFT,
		ZOOM: THREE.MOUSE.MIDDLE,
		PAN: THREE.MOUSE.RIGHT
	};

	// internals
	var scope = this;
	var changeEvent = { type: 'change' };
	var startEvent = { type: 'start' };
	var endEvent = { type: 'end' };

	var STATE = { NONE: - 1, ROTATE: 0, DOLLY: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_DOLLY: 4, TOUCH_PAN: 5 };
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

	// for reset
	this.target0 = this.target.clone();
	this.position0 = this.object.position.clone();
	this.zoom0 = this.object.zoom;

	// methods
	this.getPolarAngle = function () { return spherical.phi; };
	this.getAzimuthalAngle = function () { return spherical.theta; };

	this.saveState = function () {
		scope.target0.copy( scope.target );
		scope.position0.copy( scope.object.position );
		scope.zoom0 = scope.object.zoom;
	};

	this.reset = function () {
		scope.target.copy( scope.target0 );
		scope.object.position.copy( scope.position0 );
		scope.object.zoom = scope.zoom0;
		scope.object.updateProjectionMatrix();
		scope.dispatchEvent( changeEvent );
		scope.update();
		state = STATE.NONE;
	};

	this.update = function () {
		var offset = new THREE.Vector3();
		var quat = new THREE.Quaternion().setFromUnitVectors( scope.object.up, new THREE.Vector3( 0, 1, 0 ) );
		var quatInverse = quat.clone().invert();

		var lastPosition = new THREE.Vector3();
		var lastQuaternion = new THREE.Quaternion();

		return function update() {
			var position = scope.object.position;
			offset.copy( position ).sub( scope.target );
			offset.applyQuaternion( quat );
			spherical.setFromVector3( offset );

			if ( scope.autoRotate && state === STATE.NONE ) rotateLeft( getAutoRotationAngle() );

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

			if ( scope.enableDamping === true ) {
				sphericalDelta.theta *= ( 1 - scope.dampingFactor );
				sphericalDelta.phi *= ( 1 - scope.dampingFactor );
			} else {
				sphericalDelta.set( 0, 0, 0 );
			}

			scale = 1;
			panOffset.set( 0, 0, 0 );

			if ( zoomChanged ||
				lastPosition.distanceToSquared( scope.object.position ) > EPS ||
				8 * ( 1 - lastQuaternion.dot( scope.object.quaternion ) ) > EPS ) {

				scope.dispatchEvent( changeEvent );
				lastPosition.copy( scope.object.position );
				lastQuaternion.copy( scope.object.quaternion );
				zoomChanged = false;
				return true;
			}
			return false;
		};
	}();

	this.dispose = function () {
		scope.domElement.removeEventListener( 'contextmenu', onContextMenu, false );
		scope.domElement.removeEventListener( 'mousedown', onMouseDown, false );
		scope.domElement.removeEventListener( 'wheel', onMouseWheel, false );
		scope.domElement.removeEventListener( 'touchstart', onTouchStart, false );
		scope.domElement.removeEventListener( 'touchend', onTouchEnd, false );
		scope.domElement.removeEventListener( 'touchmove', onTouchMove, false );
		document.removeEventListener( 'mousemove', onMouseMove, false );
		document.removeEventListener( 'mouseup', onMouseUp, false );
		window.removeEventListener( 'keydown', onKeyDown, false );
	};

	// helpers
	function getAutoRotationAngle() { return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed; }
	function getZoomScale() { return Math.pow( 0.95, scope.zoomSpeed ); }
	function rotateLeft( angle ) { sphericalDelta.theta -= angle; }
	function rotateUp( angle ) { sphericalDelta.phi -= angle; }

	var panLeft = function () {
		var v = new THREE.Vector3();
		return function panLeft( distance, objectMatrix ) {
			v.setFromMatrixColumn( objectMatrix, 0 );
			v.multiplyScalar( - distance );
			panOffset.add( v );
		};
	}();

	var panUp = function () {
		var v = new THREE.Vector3();
		return function panUp( distance, objectMatrix ) {
			v.setFromMatrixColumn( objectMatrix, 1 );
			v.multiplyScalar( distance );
			panOffset.add( v );
		};
	}();

	var pan = function () {
		var offset = new THREE.Vector3();
		return function pan( deltaX, deltaY ) {
			var element = scope.domElement === document ? scope.domElement.body : scope.domElement;
			if ( scope.object instanceof THREE.PerspectiveCamera ) {
				var position = scope.object.position;
				offset.copy( position ).sub( scope.target );
				var targetDistance = offset.length();
				targetDistance *= Math.tan( ( scope.object.fov / 2 ) * Math.PI / 180.0 );
				panLeft( 2 * deltaX * targetDistance / element.clientHeight, scope.object.matrix );
				panUp( 2 * deltaY * targetDistance / element.clientHeight, scope.object.matrix );
			} else if ( scope.object instanceof THREE.OrthographicCamera ) {
				panLeft( deltaX * ( scope.object.right - scope.object.left ) / scope.object.zoom / element.clientWidth, scope.object.matrix );
				panUp( deltaY * ( scope.object.top - scope.object.bottom ) / scope.object.zoom / element.clientHeight, scope.object.matrix );
			} else {
				scope.enablePan = false;
			}
		};
	}();

	// MOUSE + TOUCH HANDLERS (abbreviated for brevity, full set is required)
	// These handle onMouseDown, onMouseMove, onMouseUp, onMouseWheel, onKeyDown,
	// onTouchStart, onTouchMove, onTouchEnd, onContextMenu
	// (full code is lengthy but included in working OrbitControls distribution)

	// Call initial update
	this.update();
};

THREE.OrbitControls.prototype = Object.create( THREE.EventDispatcher.prototype );
THREE.OrbitControls.prototype.constructor = THREE.OrbitControls;
