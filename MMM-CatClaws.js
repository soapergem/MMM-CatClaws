Module.register("MMM-CatClaws", {
	defaults: {
		updateInterval: 60000,
		cats: []
	},

	start: function() {
		Log.info("Starting module: " + this.name);
		this.loaded = false;
		this.catData = {};
		this.previousCats = [];
		this.initializeData();
		this.scheduleUpdate();
	},

	initializeData: function() {
		this.sendSocketNotification("INIT_DATA", this.config.cats);
	},

	formatDateDifference: function(dateString) {
		if (!dateString) return "Loading...";

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const catDate = new Date(dateString);
		catDate.setHours(0, 0, 0, 0);

		const diffTime = today - catDate;
		const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

		if (diffDays === 0) {
			return "Today";
		} else if (diffDays === 1) {
			return "Yesterday";
		} else {
			return diffDays + " days ago";
		}
	},

	getDom: function() {
		const wrapper = document.createElement("div");
		wrapper.className = "mmm-catclaws";

		if (!this.loaded) {
			wrapper.innerHTML = "Loading...";
			return wrapper;
		}

		const tilesContainer = document.createElement("div");
		tilesContainer.className = "tiles-container";

		if (this.config.cats.length === 0) {
			const noData = document.createElement("div");
			noData.className = "no-data";
			noData.innerHTML = "No cats configured";
			wrapper.appendChild(noData);
			return wrapper;
		}

		this.config.cats.forEach(cat => {
			const tile = document.createElement("div");
			tile.className = "cat-tile";

			const catName = document.createElement("div");
			catName.className = "cat-name";
			catName.innerHTML = cat;

			const catDate = document.createElement("div");
			catDate.className = "cat-date";
			catDate.innerHTML = this.formatDateDifference(this.catData[cat]);

			tile.appendChild(catName);
			tile.appendChild(catDate);

			// Add click handler to update date
			tile.addEventListener("click", () => {
				this.handleTileClick(cat);
			});

			tilesContainer.appendChild(tile);
		});

		wrapper.appendChild(tilesContainer);
		return wrapper;
	},

	getStyles: function() {
		return ["MMM-CatClaws.css"];
	},

	scheduleUpdate: function() {
		const self = this;
		setInterval(function() {
			// Check if config changed
			if (JSON.stringify(self.config.cats) !== JSON.stringify(self.previousCats)) {
				self.previousCats = [...self.config.cats];
				self.initializeData();
			}
			self.updateDom();
		}, this.config.updateInterval);

		this.loaded = true;
		this.previousCats = [...this.config.cats];
		this.updateDom();
	},

	handleTileClick: function(catName) {
		this.sendSocketNotification("UPDATE_CAT_DATE", catName);
	},

	notificationReceived: function(notification, payload, sender) {
		// Handle notifications from other modules
	},

	socketNotificationReceived: function(notification, payload) {
		if (notification === "DATA_LOADED") {
			this.catData = payload;
			this.updateDom();
		} else if (notification === "DATA_UPDATED") {
			this.catData = payload;
			this.updateDom();
		}
	}
});
