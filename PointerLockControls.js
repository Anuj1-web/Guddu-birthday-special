// Fixed PointerLockControls (r152) – with addEventListener support
THREE.PointerLockControls = function ( camera, domElement ) {
  const scope = this;
  this.domElement = domElement || document.body;
  this.isLocked = false;

  const changeEvent = { type: 'change' };
  const lockEvent   = { type: 'lock' };
  const unlockEvent = { type: 'unlock' };

  const euler = new THREE.Euler(0, 0, 0, 'YXZ');
  const PI_2 = Math.PI / 2;

  function onMouseMove(event) {
    if (scope.isLocked === false) return;
    const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

    euler.setFromQuaternion(camera.quaternion);
    euler.y -= movementX * 0.002;
    euler.x -= movementY * 0.002;
    euler.x = Math.max(-PI_2, Math.min(PI_2, euler.x));
    camera.quaternion.setFromEuler(euler);
    scope.dispatchEvent(changeEvent);
  }

  function onPointerlockChange() {
    if (document.pointerLockElement === scope.domElement) {
      scope.dispatchEvent(lockEvent);
      scope.isLocked = true;
    } else {
      scope.dispatchEvent(unlockEvent);
      scope.isLocked = false;
    }
  }

  function onPointerlockError() {
    console.error('PointerLockControls: Unable to use Pointer Lock API');
  }

  this.connect = function () {
    document.addEventListener('mousemove', onMouseMove, false);
    document.addEventListener('pointerlockchange', onPointerlockChange, false);
    document.addEventListener('pointerlockerror', onPointerlockError, false);
  };

  this.disconnect = function () {
    document.removeEventListener('mousemove', onMouseMove, false);
    document.removeEventListener('pointerlockchange', onPointerlockChange, false);
    document.removeEventListener('pointerlockerror', onPointerlockError, false);
  };

  this.dispose = function () {
    this.disconnect();
  };

  this.lock = function () {
    this.domElement.requestPointerLock();
  };

  this.unlock = function () {
    document.exitPointerLock();
  };

  this.connect();
};

// Add basic event system
THREE.PointerLockControls.prototype = Object.create(THREE.EventDispatcher.prototype);
THREE.PointerLockControls.prototype.constructor = THREE.PointerLockControls;
