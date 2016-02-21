'use strict';



module.exports = function(path, app, express, config) {

		var models = [];


    app.use('/fritz', express.static(path.join(config.paths.fritz, 'admin')));


    app.use('/fritz/models', function() {
    	
    	console.log(models);

    });

    return {
        register: function(descriptor, model) {
        	descriptor.model = model;

        	models.push(descriptor);

        	console.log(models);
        } 
    };
};
