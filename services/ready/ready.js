var request = require('request');


function Ready () {

}

Ready.prototype.getAudioBookWithISBN = function (id) {
	return new Promise((resolve, reject) => {
		if (id == '9789198422900') {
			resolve({
				id: 'levamedautism',
				name: 'Jag upphäver gravitation',
				version: 'Del 1',
				type: 'audiobook',
				label: 'Svampfredag',
				authors: [{
					id: 'alexanderforselius',
					firstName: 'Marius Alexander',
					lastName: 'Forselius',
					uri: 'ready:author:alexanderforselius'
				}],
				category: {
					id: 'saogf',
					name: 'Autobigraphy',
					uri: 'ready:biography:saogf'
				}
			});
		} else {
			reject(404);
		}
	})
}

Ready.prototype.getChaptersForAudioBookWithISBN = function (id) {
	return new Promise(
		function (resolve, reject) {
			if (id == '9789198422900') {
				resolve({
					objects: [{
						id: '1',
					}]
				});
			}
		}
	);
}