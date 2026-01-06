const NodeHelper = require("node_helper");
const fs = require("fs");
const path = require("path");

module.exports = NodeHelper.create({
	start: function() {
		console.log("Starting node helper for: " + this.name);
		this.dataFile = path.join(__dirname, "data.json");
	},

	socketNotificationReceived: function(notification, payload) {
		console.log(this.name + " received notification: " + notification);

		if (notification === "INIT_DATA") {
			this.initializeData(payload);
		} else if (notification === "UPDATE_CAT_DATE") {
			this.updateCatDate(payload);
		}
	},

	loadData: function() {
		try {
			if (fs.existsSync(this.dataFile)) {
				const data = fs.readFileSync(this.dataFile, "utf8");
				return JSON.parse(data);
			}
		} catch (error) {
			console.error("Error loading data:", error);
		}
		return {};
	},

	saveData: function(data) {
		try {
			fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2), "utf8");
			return true;
		} catch (error) {
			console.error("Error saving data:", error);
			return false;
		}
	},

	initializeData: function(cats) {
		// Remove duplicates by converting to Set and back to array
		const uniqueCats = [...new Set(cats)];

		const data = this.loadData();
		// Use local date instead of UTC to match frontend timezone
		const now = new Date();
		const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
		let modified = false;

		// Add any new cats with today's date
		uniqueCats.forEach(cat => {
			if (!data[cat]) {
				data[cat] = today;
				modified = true;
			}
		});

		// Remove cats that are no longer in the config
		Object.keys(data).forEach(cat => {
			if (!uniqueCats.includes(cat)) {
				delete data[cat];
				modified = true;
			}
		});

		if (modified) {
			this.saveData(data);
		}

		this.sendSocketNotification("DATA_LOADED", data);
	},

	updateCatDate: function(payload) {
		const data = this.loadData();

		// Handle both string (cat name only) and object (cat name + date)
		let catName, date;
		if (typeof payload === 'string') {
			catName = payload;
			// Use local date instead of UTC to match frontend timezone
			const now = new Date();
			date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
		} else {
			catName = payload.catName;
			date = payload.date || (() => {
				const now = new Date();
				return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
			})();
		}

		data[catName] = date;

		if (this.saveData(data)) {
			this.sendSocketNotification("DATA_UPDATED", data);
		}
	}
});
