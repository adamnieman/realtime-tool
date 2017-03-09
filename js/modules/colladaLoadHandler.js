function colladaLoadHandler (sb) {

	/*var objects = [
		{	
			name: "human",
			path: "assets/models/human.dae",
			height: 1.7,
			model: null,
		},

		{	
			name: "bus",
			path: "assets/models/double-decker-bus-4.dae",
			height: 4.3,
			model: null,
		}
	];*/

	function INIT () {
		sb.listen({
			listenFor: ["add-model"],
			moduleID: this.moduleID,
			moduleFunction: "modelHandler"
		})
	}

	function MODELHANDLER (d) {
		clear(d.parent);
		var object = select_object(d.base_m);
		debug.log("Model selected: '"+object.name+"'.");

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

		var bBox = new THREE.Box3().setFromObject(model);

		model.position.y = -bBox.min.y;

		var offsetX = model.position.x-bBox.min.x;
		model.position.x = (base/2) + (base/10) + offsetX;

		var offsetZ = bBox.max.z - model.position.z;
		model.position.z = (0 - offsetZ)+(base/4);
	}


	function load (object, callback) {
		var loader = new THREE.ColladaLoader();


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