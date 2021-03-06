var express = require('express');
var bodyParser = require('body-parser');
var PythonShell = require('python-shell');
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');
var db = require('../database/index.js');

var app = express();

app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/../client/dist'));

var port = process.env.PORT || 3030;
app.listen(port, () => {
	console.log('Listening on port ' + port + '...');
});


// this function would best be factored out into a microservice, running on its own separate server that could then be scaled
// so-- turn that image processor into its own API; thus, other applications could use it as well.

//routes
app.post('/api/upload', function (req, res) {

	// create an incoming form object
	var form = new formidable.IncomingForm();

	// specify that we want to allow the user to upload multiple files in a single request
	form.multiples = true;

	// store all uploads in the /uploads directory
	form.uploadDir = path.join(__dirname, '/python/uploads');

	// every time a file has been uploaded successfully,
	// rename it to it's orignal name
	form.on('file', function (name, file) {
		
		fs.rename(file.path, path.join(form.uploadDir, 'input.png'), (err) => {
			if (err) {
				console.log(err);
			}
	    
	    var options = {
	    	args: [file]
	    }

	    PythonShell.run(path.join(__dirname + '/python/deep_scan.py'), options, (err, data) => {
	    	console.log('response from python script: ', data);
	    	if (err) {
	    		res.send(err);
	      }
	      res.send(data);
	    })
		});

	});

	// log any errors that occur
	form.on('error', function (err) {
		console.log('An error has occured: \n' + err);
		res.send(err);
	});

	// parse the incoming request containing the form data
	form.parse(req);

});

app.get('/api/scantest', function (req, res) {
	var pyshell = new PythonShell('/python/deep_scan.py');
	pyshell.on('message', function (message) {
		//OUTPUT deep_scan.py
		console.log(message);

		//no response??
	});
});

