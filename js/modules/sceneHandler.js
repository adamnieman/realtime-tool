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
		if (d.id != this.moduleID) {
			return;
		}

		console.warn = function () {};

		sb.three = d;

		var sphere_count_limit = 250;
		var position_check_recursions = 15;
		var gravity_vector = new THREE.Vector3(0, -9.8, 0);


		var stack_base_count = 20
		var stack_base_m = sb.rate.get_sphere().r_m*stack_base_count;

		var sphere_geom = new THREE.SphereGeometry(sb.rate.get_sphere().r_m, 6, 4)

		var interval;
		var timeout;
		//setup groups
		//model group
		sb.three.groups.model =  new THREE.Object3D();
		sb.three.scene.add(sb.three.groups.model);

		//primary group - contains plane and ghost spheres
		sb.three.groups.primary =  new THREE.Object3D();
		sb.three.scene.add(sb.three.groups.primary);

		//secondary group - contains spheres while in air
		sb.three.groups.secondary =  new THREE.Object3D();
		sb.three.scene.add(sb.three.groups.secondary);

		///MAKE THIS DO THE THING
		var colour = index.gas_lookup[sb.rate.get_gas().name].colour;
		if (debug.sentinel(colour && utility.isValidHex(colour), "No valid colour associated with '"+sb.rate.get_gas().name+"'. Using default.")) {
			colour = "#00aeef";
		}

		//setup materials
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

		sb.notify({
			type : "add-model",
			data: {
				parent: sb.three.groups.model,
				base_m: stack_base_m
			}
		});

		//add plane
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

		updateScene (stack_base_m);
		render();
		createInterval()

		function createInterval () {
			if (sb.rate.get_sphere().s_per === Infinity) {
				debug.log("Zero spheres to be generated for a rate of 0 kg/s");
				return;
			}

			var sphere_count = 0;
			clearScene()

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
			var sphere = new THREE.Mesh(sphere_geom, sb.three.materials.sphere);
			var r = sb.rate.get_sphere().r_m;
			var b = stack_base_m;

			var vertices_array = sphere.geometry.vertices
			var vertices_array_south = []

			var v;
			var l = vertices_array.length;
			for (v = 0; v < l; v++){
					
				if (vertices_array[v].y <= 0){
					vertices_array_south.push(vertices_array[v])
				}
			}

			var best_distance = 0;
			var best_option;
			var drop_point = stack_base_m;

			var k;
			for (k = 0; k < position_check_recursions; k++){
					
				var smallest_distance = Infinity
				var x_pos = (Math.random()*(b-(r*2)))-(b/2)
				var z_pos = (Math.random()*(b-(r*2)))-(b/2)
				sphere.position.set(x_pos, drop_point, z_pos)
						
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
						
				if (smallest_distance > best_distance){
							
					best_distance = smallest_distance
					best_option = [x_pos, z_pos]
							
				}
			}

			var start_point = new THREE.Vector3(0,-(r*2),0)
			var end_point = new THREE.Vector3(best_option[0], drop_point-best_distance, best_option[1])
				
			sphere.position.x = start_point.x
			sphere.position.y = start_point.y
			sphere.position.z = start_point.z
			sphere.receiveShadow = true;
			sphere.castShadow = true;
			//sphere.updateMatrixWorld()
			sb.three.groups.secondary.add(sphere)

			var _sphere = new THREE.Mesh (sphere_geom, sb.three.materials.ghost)
				_sphere.position.x = end_point.x
				_sphere.position.y = end_point.y
				_sphere.position.z = end_point.z
				sb.three.groups.primary.add(_sphere)
				
				
			
			var start = (new Date().getTime() / 1000)
			
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