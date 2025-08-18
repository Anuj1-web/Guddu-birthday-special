// PointerLockControls.js (r152-compatible, non-module, global THREE)
THREE.PointerLockControls = function ( camera, domElement ) {
  const scope = this;
  this.domElement = domElement || document.body;
  this.isLocked = false;

  camera.rotation.set(0, 0, 0);

  const euler = new THREE.Euler(0, 0, 0, 'YXZ');
  const PI_2 = Math.PI / 2;

  function onMouseMove( event ) {
    if (scope.isLocked === false) return;
    const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

    euler.setFromQuaternion(camera.quaternion);
    euler.y -= movementX * 0.002;
    euler.x -= movementY * 0.002;
    euler.x = Math.max(-PI_2, Math.min(PI_2, euler.x));
    camera.quaternion.setFromEuler(euler);
  }

  function onPointerlockChange() { scope.isLocked = document.pointerLockElement === scope.domElement; }
  function onPointerlockError() { console.error('PointerLockControls: Unable to use Pointer Lock API'); }

  this.connect = function () {
    this.domElement.addEventListener('mousemove', onMouseMove);
    document.addEventListener('pointerlockchange', onPointerlockChange);
    document.addEventListener('pointerlockerror', onPointerlockError);
  };

  this.disconnect = function () {
    this.domElement.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('pointerlockchange', onPointerlockChange);
    document.removeEventListener('pointerlockerror', onPointerlockError);
  };

  this.dispose = function () { this.disconnect(); };

  this.lock = function () { this.domElement.requestPointerLock(); };
  this.unlock = function () { document.exitPointerLock(); };

  this.connect();
};
