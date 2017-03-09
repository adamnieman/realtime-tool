function sceneSetup (sb) {

	function INIT () {
		sb.listen({
			listenFor: ["create-scene"],
			moduleID: this.moduleID,
			moduleFunction: "createScene",
		})
	}

	function CREATESCENE (d) {
		if (debug.sentinel(d.id, "No valid id provided with scene request. Failed to initialise scene.") ||
			debug.sentinel(d.parent, "No valid parent provided with scene request. Failed to initialise scene.")) {
			return;
		}

		var scene = new THREE.Scene();

		var camera = new THREE.PerspectiveCamera(30, d.w / d.h, 0.1, 10000000);
			
			camera.position.x = 3*0.8;
			camera.position.y = 2*0.8;
			camera.position.z = 4*0.8;
			camera.lookAt(new THREE.Vector3(0, 0, 0))
			scene.add(camera);

		var renderer = new THREE.WebGLRenderer({preserveDrawingBuffer: true, antialias: true });
			renderer.setClearColor(new THREE.Color(0xeeeeee));
			renderer.setSize(d.w, d.h);
			renderer.shadowMap.enabled = true;
			renderer.shadowMap.type = THREE.PCFSoftShadowMap;

		var axes = new THREE.AxisHelper(100);
			//scene.add(axes);

		var directionlight = new THREE.DirectionalLight( 0xffffff );
			directionlight.position.set( 10, 10, 10 );
			directionlight.target.position.set(5,5,5);
			directionlight.castShadow = true;
			directionlight.shadow.camera.near = 0.01;
			directionlight.shadow.camera.far= 50;
			scene.add(directionlight);

		var spotlight = new THREE.SpotLight(0xffffff);
			//spotlight.position.set(100, 100, 0);
			//spotlight.castShadow = true;
			//spotlight.shadow.camera.near = 0.01;
			//spotlight.shadow.camera.far= 10000000;
			//scene.add(spotlight);

		var hemilight = new THREE.HemisphereLight( 0xffffff, 0xf7f7f7, 0.2 ); 
			//scene.add(hemilight);

		var ambientlight = new THREE.AmbientLight(0xffffff, 0.1)
			//scene.add(ambientlight);

		d.parent.appendChild(renderer.domElement);

		sb.resize.push(function() {
			//sb.w and sb.h 
			camera.aspect = sb.w / sb.h;
    		camera.updateProjectionMatrix();

    		renderer.setSize(sb.w, sb.h);
		})

		var three = {
			id: d.id,
			scene: scene,
			camera: camera,
			renderer: renderer,
			lights: {
				spot: spotlight,
				directional: directionlight,
			},
			groups: {

			},
			materials: {

			},
			render: function () {
				renderer.render(scene, camera);
			}
		}

		sb.notify({
			type : "return-scene",
			data: three,
		});

	}
	
	function DESTROY () {
		sb.unlisten(this.moduleID)
	}

	return {
        init : INIT,
        createScene: CREATESCENE,
        destroy : DESTROY
    };
}