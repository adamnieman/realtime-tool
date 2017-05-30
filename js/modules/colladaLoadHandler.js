function colladaLoadHandler (sb) {

	function INIT () {
		sb.listen({
			listenFor: ["add-model"],
			moduleID: this.moduleID,
			moduleFunction: "modelHandler"
		})

	}

	function MODELHANDLER (d) {

		/*
		Removes any meshes/previous models from group.
		*/

		clear(d.parent);

		/*
		Chooses an appropriate scaling object based on the approximate width of the pile of spheres.
		*/

		var object = select_object(d.base_m);
		debug.log("Model selected: '"+object.name+"'.");

		/*
		Loads the scaling object mesh, positions it, and adds it to the group.
		*/

		load(object, function (model) {

			position(model, d.base_m);
			d.parent.add(model)
		})

	}

	function clear (group) {
		while (group.children.length > 0) {
			group.remove(group.children[0])
		};
	}

	function select_object (base_m) {

		/*
		Selects scaling object by choosing the one closest in height to a quarter of the sphere-pile's width.
		*/

		var min_diff = Infinity;
		var object = null;

		var i;
		var l = sb.settings.scaling_objects.length;

		for (i=0; i<l; i++) {
			var diff = Math.abs((base_m*0.25)-sb.settings.scaling_objects[i].height);
			if (!object || diff < min_diff) {
				min_diff = diff;
				object = sb.settings.scaling_objects[i];
			}
		}

		return object;
	}

	function position (model, base) {

		/*
		Positions scaling object in front and close to sphere-pile.
		Uses bounding box values to compensate for any offset of the model from 0,0,0.
		*/

		var bBox = new THREE.Box3().setFromObject(model);

		model.position.y = -bBox.min.y;

		var offsetX = model.position.x-bBox.min.x;
		model.position.x = (base/2) + (base/10) + offsetX;

		var offsetZ = bBox.max.z - model.position.z;
		model.position.z = (0 - offsetZ)+(base/4);
	}


	function load (object, callback) {
		var loader = new THREE.ColladaLoader();

		/*
		Uses THREE.ColladaLoader to load scaling object mesh. 
		Applies rotation, shadow and material (if model is "person").
		Scales model so it is the correct size with regards to the rest of the scene (1 unit = 1 meter).
		Finally, passes scaling object as an argument to the callback function.
		*/

		loader.load(object.path, function (result) {
			var model = result.scene.children[0].clone();
			model.rotation.x = -Math.PI/2
			model.rotation.z = Math.PI/4
			model.castShadow = true;

			if (object.name === "person") {
				changeMaterial (model.children, sb.three.materials.model);
			}
			makeCorrectSize (model, object.height);
			giveShadow (model.children);
			object.distance = getGreatestDistance(model);
			callback(model);
		});
	}

	function getGreatestDistance (object) {
		var bBox = new THREE.Box3().setFromObject(object);

		var w = bBox.max.x - bBox.min.x
		var h = bBox.max.y - bBox.min.y
		var d = bBox.max.z - bBox.min.z

		var distance = (w > h) ? w : h;
		distance = (distance > d) ? distance : d;

		return distance;
	}

	function giveShadow (childGroup) {

		/*
		Applies shadow casting ability to every child mesh of a group recursively.
		*/
			   	
		for (var w = 0; w < childGroup.length; w++){
			if (childGroup[w].material){
				//console.log(childGroup[w]);
				childGroup[w].castShadow = true;
		    	//childGroup[w].receiveShadow = true;
			}
		    else {
				 giveShadow (childGroup[w].children)
			}
		}
	}

	function changeMaterial (childGroup, material) {
			
		/*
		Applies material to every child mesh of a group recursively.
		*/

		for (var w = 0; w < childGroup.length; w++){
			if (childGroup[w].material){
				 childGroup[w].material = material
			}
		    else {
				 changeMaterial (childGroup[w].children, material)
			}
		}
	}

	function makeCorrectSize (object, correctHeight){
		/*
		Calculates starting height of object and scales it appropriately so it ends at the correct height.
		*/
		var bBox = new THREE.Box3().setFromObject(object);
		var currentHeight = bBox.max.y - bBox.min.y
		var scale = (1/currentHeight) * correctHeight		
				    
		object.scale.set(scale, scale, scale);
		object.position.x = 0;
		object.position.y = 0;
		object.position.z = 0;
				
	}
	
	function DESTROY () {
		sb.unlisten(this.moduleID)
		objects = null;
		makeCorrectSize, changeMaterial, giveShadow, select_object, clear, position, load = null;
	}

	return {
        init : INIT,
        modelHandler: MODELHANDLER,
        destroy : DESTROY
    };
}