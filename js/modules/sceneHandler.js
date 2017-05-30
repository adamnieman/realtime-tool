function sceneHandler (sb) {


	function INIT () {
		sb.listen({
			listenFor: ["queries-complete"],
			moduleID: this.moduleID,
			moduleFunction: "requestScene",
		})

		sb.listen({
			listenFor: ["return-scene"],
			moduleID: this.moduleID,
			moduleFunction: "receiveScene",
		})
	}

	function REQUESTSCENE () {

		/*
		Makes a request for a THREE scene
		*/

		sb.notify({
			type : "create-scene",
			data: {
				id: this.moduleID,
				w: sb.w,
				h: sb.h,
				parent: document.getElementById("vis"),
			}
		});
	}

	function RECEIVESCENE (d) {

		/*
		Receives THREE scene. Check that it is intended for this module's use. Returns early if not.
		*/

		if (d.id != this.moduleID) {
			return;
		}

		/*
		Due to quirks with FireFox, creating a THREE.js scene results in so many console warn messages it's hard
		to read actual debug messages. This reassigns console.warn to an empty function and stops anything from printing.
		*/

		console.warn = function () {};

		/*
		Assigns the returned scene to the sandbox
		*/

		sb.three = d;

		/*
		Sets up values which will be used when generating the sphere-pile
		*/

		//number of soheres before the pile clears and starts again
		var sphere_count_limit = 250; 

		//number of positions each sphere will try before deciding on the best one
		//a higher value will result in a more tightly packed (realistic) pile, but slower code
		var position_check_recursions = 15; 

		//gravity vector to simulate earth's
		var gravity_vector = new THREE.Vector3(0, -9.8, 0);

		//width (in spheres) of the base of the stack
		var stack_base_count = 20

		//width (in meters) of the base of the stack
		var stack_base_m = sb.rate.get_sphere().r_m*stack_base_count;

		//sphere geometry to be reused for each sohere instance
		//the last 2 parameters refer to latitudinal and longitudinal segments
		//higher values mean more realistic (rounder) spheres but significantly slower code
		var sphere_geom = new THREE.SphereGeometry(sb.rate.get_sphere().r_m, 6, 4)

		//these will hold the interval and timeout functions which control time between sphere launch and time between sphere clearing
		var interval;
		var timeout;

		//model group - contains scaling object
		sb.three.groups.model =  new THREE.Object3D();
		sb.three.scene.add(sb.three.groups.model);

		//primary group - contains plane and ghost spheres
		sb.three.groups.primary =  new THREE.Object3D();
		sb.three.scene.add(sb.three.groups.primary);

		//secondary group - contains spheres while in air
		sb.three.groups.secondary =  new THREE.Object3D();
		sb.three.scene.add(sb.three.groups.secondary);

		/*
		Checks if the visualised gas has a colour value associated with it (this would have been defined in settings).
		If it does, checks that the colour is a valid hex code then uses that as the sphere colour.
		If there is no colour, or the colour is invalid, uses a default value of "#00aeef" (light turquoise/blue).
		*/
		var colour = index.gas_lookup[sb.rate.get_gas().name].colour;
		if (debug.sentinel(colour && utility.isValidHex(colour), "No valid colour associated with '"+sb.rate.get_gas().name+"'. Using default.")) {
			colour = "#00aeef";
		}

		/*
		Sets up materials for use in the scene.
		The ghost material is an invisible material which will be applied to placeholder spheres used only for mesh collision.
		*/
		sb.three.materials.plane = new THREE.MeshLambertMaterial({color: 0xf7f7f7});
		sb.three.materials.model = new THREE.MeshBasicMaterial({color: 0x888888});
		sb.three.materials.ghost = new THREE.MeshBasicMaterial({color: 0x000000, transparent: true, opacity: 0});
		sb.three.materials.sphere = new THREE.MeshPhongMaterial({
			color: colour,//0x00aeef, 
			transparent: true,
			opacity: 0.65,
			reflectivity: 1,
			envMap: loadCubemap()
		})

		/*
		Requests scaling object.
		*/
		sb.notify({
			type : "add-model",
			data: {
				parent: sb.three.groups.model,
				base_m: stack_base_m
			}
		});

		/*
		Sets up and adds plane.
		*/
		sb.three.plane = new THREE.Mesh (
			new THREE.BoxGeometry(50, 1, 50), 
			new THREE.MeshLambertMaterial({color: 0xfefefe})
		)
		sb.three.plane.receiveShadow = true;
		sb.three.plane.position.y = -0.5;
		sb.three.groups.primary.add(sb.three.plane);

		function _DESTROY () {
			sphere_count_limit, position_check_recursions, gravity_vector, stack_base_count, stack_base_m, sphere_geom = null;
			
			clearInterval(interval);
			clearTimeout(timeout);

			interval, timeout = null;
			createInterval, addSphere, launch = null;
		}

		this._destroy = _DESTROY;

		/*
		Updates the position etc of the light, camera and plane to suit the scale of the sphere-pile.
		*/
		updateScene (stack_base_m);

		/*
		Begins the render loop.
		*/
		render();

		/*
		Begins sphere creation.
		*/
		createInterval()

		function createInterval () {

			/*
			If sphere rate is zero, does not create any spheres and returns early.
			*/
			if (sb.rate.get_sphere().s_per === Infinity) {
				debug.log("Zero spheres to be generated for a rate of 0 kg/s");
				return;
			}

			//sphere_count is incremented every time a sphere is created
			var sphere_count = 0;

			/*
			Removes any existing spheres (or ghost spheres) from scene.
			*/
			clearScene()


			/*
			Runs interval code to generates one sphere every <time between spheres>.
			If sphere count is equal to or exceeding the sphere limit, lets spheres continue to fall and settle 
			for 5 seconds before clearing the scene and restarting the sphere creation process.
			*/
			interval = setInterval(function () {
				addSphere ();
				sphere_count++;
				if (sphere_count >= sphere_count_limit) {
					clearInterval(interval);
					timeout = setTimeout(createInterval, 5000);
				}
			}, sb.rate.get_sphere().s_per*1000)
		}

		function addSphere () {

			/*
			Creates a sphere mesh
			*/
			var sphere = new THREE.Mesh(sphere_geom, sb.three.materials.sphere);
			var r = sb.rate.get_sphere().r_m;
			var b = stack_base_m;

			/*
			Gets all the vertices of that sohere and stores them in an array. 
			Initialises an empty array vertices_array_south.
			*/
			var vertices_array = sphere.geometry.vertices
			var vertices_array_south = []

			/*
			Iterates over all vertices in vertices_array and pushes all which are in the "southern hemisphere"
			of the sphere into vertices_array_south
			*/
			var v;
			var l = vertices_array.length;
			for (v = 0; v < l; v++){
					
				if (vertices_array[v].y <= 0){
					vertices_array_south.push(vertices_array[v])
				}
			}

			//Stores the furthest distance sphere will be able to fall
			var best_distance = 0;
			//Stores the x,z co-ordinates at which the sphere will be able to fall best_distance
			var best_option;
			//Stores the height from which the sphere will be dropped
			var drop_point = stack_base_m;

			/*
			Recurses position_check_recursions number of times, randomly generating x,z co-ordinates and then
			seeing how far the sphere could fall directly downwards from that position. The furthest fall is stored
			in best_distance, and the associated position in best_option. If a better position is found then these
			values are overwritten.
			*/
			var k;
			for (k = 0; k < position_check_recursions; k++){
				
				var smallest_distance = Infinity
				var x_pos = (Math.random()*(b-(r*2)))-(b/2)
				var z_pos = (Math.random()*(b-(r*2)))-(b/2)
				
				/*
				Sphere is moved into position from which to check fall distance
				*/
				sphere.position.set(x_pos, drop_point, z_pos)
				
				/*
				The fall distance of a sphere is worked out by casting rays down from each southern vertex of that sphere,
				and checking the distance before that ray intersects another mesh. A sphere can only fall until its first 
				vertex intersects something, so we store the smallest distance between a vertex and an intersection in the
				variable smallest_distance
				*/	
				for (var w = 0; w < vertices_array_south.length; w++){
							
					var position = new THREE.Vector3(parseFloat(sphere.position.x+vertices_array_south[w].x), parseFloat(sphere.position.y+vertices_array_south[w].y), parseFloat(sphere.position.z+vertices_array_south[w].z))
					var direction = new THREE.Vector3(0, -1, 0)
					var ray = new THREE.Raycaster(position,direction)
						ray.linePrecision = 0.00001
							
					var intersects = ray.intersectObjects(sb.three.groups.primary.children)
					if (intersects[0] &&
						intersects[0].distance < smallest_distance){
						smallest_distance = intersects[0].distance
					}
								
				}
				
				/*
				If the smallest_distance variable (ie the distance the sphere can fall before intersecting another mesh)
				is greater than the current best_distance, both the best_distance and best_option variables are replaced
				*/		
				if (smallest_distance > best_distance){
							
					best_distance = smallest_distance
					best_option = [x_pos, z_pos]
							
				}
			}

			/*
			The sphere starts in the center of the base, just beneath the ground plane. 
			It ends up below the drop-point, the furthest it is able to fall without intersecting the plane or
			existing spheres.
			*/
			var start_point = new THREE.Vector3(0,-(r*2),0)
			var end_point = new THREE.Vector3(best_option[0], drop_point-best_distance, best_option[1])
			
			/*
			The sphere is placed at the start position ready to be launched
			*/	
			sphere.position.x = start_point.x
			sphere.position.y = start_point.y
			sphere.position.z = start_point.z
			sphere.receiveShadow = true;
			sphere.castShadow = true;

			/*
			The sphere is added to the secondary group - this group is NOT used for raycasting/checking for intersections.
			This is so there's no risk of raycasters thinking they have intersected a sphere before it is in its final position.
			*/	
			sb.three.groups.secondary.add(sphere)

			/*
			The code below creates a ghost sphere. This invisible sphere is placed at the point the main sphere will end up. 
			The ghost sphere is added to the primary group - this group IS used for raycasting/checking for intersections.
			This is so that whilst a sphere is in the air, other spheres will not think they can fall into its intended space.
			*/	
			var _sphere = new THREE.Mesh (sphere_geom, sb.three.materials.ghost)
				_sphere.position.x = end_point.x
				_sphere.position.y = end_point.y
				_sphere.position.z = end_point.z
				sb.three.groups.primary.add(_sphere)
				
				
			/*
			This sets start to the time when the sphere is launched
			*/	
			var start = (new Date().getTime() / 1000)
			

			/*
			This launches the sphere
			*/	
			launch (sphere, start_point, end_point, start);
		}

		function launch (target, start_point, end_point, start)/*(target, ghost, dropPoint, start, bestDistance)*/ {
			//console.log((visualisationObject.m_base/visualisationObject.sphere.kg_CO2)/250, visualisationObject.m_base/3)
			var a = gravity_vector;

			var h = stack_base_m*0.75;
			var u_y = Math.sqrt(Math.abs(2*a.y*h));
			var u = new THREE.Vector3(0, u_y, 0)
			
			var time = (-(u.y)-Math.sqrt(Math.pow(u.y, 2) - 4*(a.y/2)*(-end_point.y)))/(2*(a.y/2))
			u.x = (end_point.x/time)-((a.x*time)/2)
			u.z = (end_point.z/time)-((a.z*time)/2)
			
			
			var launch_sphere = setInterval(function () {
				
				var t = (new Date().getTime() / 1000) - start
				
				if (t<time) {
					
					var _u = new THREE.Vector3()
					var _a = new THREE.Vector3()
		
					var s = (_u.copy(u).multiplyScalar(t)).add(_a.copy(a).multiplyScalar((Math.pow(t, 2))*0.5))
					
					target.position.x = s.x	
					target.position.y = s.y
					target.position.z = s.z	
					
							
				}
				else {
					clearInterval(launch_sphere)
					
					target.position.x = end_point.x	
					target.position.y = end_point.y
					target.position.z = end_point.z	
					
					
					//target.updateMatrixWorld()
				}
			}, (1000/25))
		
		}
	}

	

	function render () {
		//sb.three.groups.dynamic.rotation.y += speed;
		sb.three.render();
		requestAnimationFrame(render);
	}

	function loadCubemap () {
		var folder = "assets/cubemaps/Citadella2";
		var extension = "jpg";
		var urls = [
		  folder+"/posx."+extension,
		  folder+"/negx."+extension,
		  folder+"/posy."+extension,
		  folder+"/negy."+extension,
		  folder+"/posz."+extension,
		  folder+"/negz."+extension,
		]

		var loader = new THREE.CubeTextureLoader();
	    loader.setCrossOrigin( 'anonymous' );
		var cubemap = loader.load(urls);
		cubemap.format = THREE.RGBFormat;

		return cubemap;
	}

	function updateScene (stack_base_m) {

		if (debug.sentinel(!isNaN(stack_base_m), "Stack base measurement is non-numeric. Using a default value of 10 instead.")) {
			stack_base_m = 10;
		}

		var distance_m = stack_base_m < 2.5 ? 2.5 : stack_base_m;
		distance_m += stack_base_m/2;

		updatePlane (distance_m);
		updateCamera (distance_m, stack_base_m);
		updateLight (distance_m);
	}

	function updatePlane (distance_m) {
		sb.three.plane.scale.x = distance_m*50;
		sb.three.plane.scale.z = distance_m*50;
	}

	function updateCamera (distance_m, stack_base_m) {
		sb.three.camera.position.x = distance_m*1.5;
		sb.three.camera.position.y = 1.6;
		sb.three.camera.position.z = distance_m*1.5;

		sb.three.camera.lookAt(new THREE.Vector3(0, stack_base_m/2, 0))
	}

	function updateLight (distance_m) {
		sb.three.lights.directional.position.set(distance_m/2, distance_m, distance_m*2);
		sb.three.lights.directional.target.position.set(distance_m/4, distance_m/2, 0);

		sb.three.lights.directional.shadow.camera.left = -distance_m;
		sb.three.lights.directional.shadow.camera.right = distance_m;
		sb.three.lights.directional.shadow.camera.top = distance_m;
		sb.three.lights.directional.shadow.camera.bottom = -distance_m;
		sb.three.lights.directional.shadow.camera.near = distance_m/10;
		sb.three.lights.directional.shadow.camera.far= distance_m*5;

		sb.three.lights.directional.shadow.camera.updateProjectionMatrix();
	}

	function clearScene () {
		while (sb.three.groups.secondary.children.length > 0) {
			sb.three.groups.secondary.remove(sb.three.groups.secondary.children[0])
		};

		while (sb.three.groups.primary.children.length > 1) {
			sb.three.groups.primary.remove(sb.three.groups.primary.children[1])
		};
	}

	
	
	function DESTROY () {
		sb.unlisten(this.moduleID)
		this._destroy();

		clearScene, updateLight, updateCamera, updatePlane, updateScene, loadCubemap, render = null;
	}

	return {
        init : INIT,
        requestScene: REQUESTSCENE,
        receiveScene: RECEIVESCENE,
        destroy : DESTROY
    };
}