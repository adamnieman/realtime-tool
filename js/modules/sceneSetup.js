function sceneSetup (sb) {

	function INIT () {
		sb.listen({
			listenFor: ["create-scene"],
			moduleID: this.moduleID,
			moduleFunction: "createScene",
		})
	}

	function CREATESCENE (d) {

		/*
		This code creates a THREE scene and returns references to all important scene elements in a structured object.
		*/

		/*
		Checks that argument d contains an id, and a parent to append the scene to.
		*/

		if (debug.sentinel(d.id, "No valid id provided with scene request. Failed to initialise scene.") ||
			debug.sentinel(d.parent, "No valid parent provided with scene request. Failed to initialise scene.")) {
			return;
		}


		//create scene
		var scene = new THREE.Scene();

		//create camera
		var camera = new THREE.PerspectiveCamera(30, d.w / d.h, 0.1, 10000000);
			
			camera.position.x = 3*0.8;
			camera.position.y = 2*0.8;
			camera.position.z = 4*0.8;
			camera.lookAt(new THREE.Vector3(0, 0, 0))
			scene.add(camera);

		//create renderer
		var renderer = new THREE.WebGLRenderer({preserveDrawingBuffer: true, antialias: true });
			renderer.setClearColor(new THREE.Color(0xeeeeee));
			renderer.setSize(d.w, d.h);
			renderer.shadowMap.enabled = true;
			renderer.shadowMap.type = THREE.PCFSoftShadowMap;

		//create axes
		var axes = new THREE.AxisHelper(100);
			//scene.add(axes);

		//create directional lighting
		var directionlight = new THREE.DirectionalLight( 0xffffff );
			directionlight.position.set( 10, 10, 10 );
			directionlight.target.position.set(5,5,5);
			directionlight.castShadow = true;
			directionlight.shadow.camera.near = 0.01;
			directionlight.shadow.camera.far= 50;
			scene.add(directionlight);

		//append renderer to the parent dom element
		d.parent.appendChild(renderer.domElement);

		/*
		Creates resize function and adds to sb.resize to be called when "resize" notification is fired.
		*/
		sb.resize.push(function() {
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