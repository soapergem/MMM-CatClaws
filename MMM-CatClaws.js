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
		this.undoData = null; // {catName: string, previousDate: string}
		this.undoVisible = false;
		this.undoTimer = null;
		this.undoTileElement = null; // Store reference to undo tile DOM element
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

		// Parse date string as local time to avoid timezone issues
		const [year, month, day] = dateString.split('-').map(Number);
		const catDate = new Date(year, month - 1, day);

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

		// Add undo tile
		const undoTile = document.createElement("div");
		undoTile.className = "cat-tile undo-tile";
		if (!this.undoVisible) {
			undoTile.classList.add("hidden");
		}

		const undoSymbol = document.createElement("div");
		undoSymbol.className = "cat-name";
		undoSymbol.innerHTML = "\u21BA";

		const undoText = document.createElement("div");
		undoText.className = "cat-date";
		undoText.innerHTML = "Undo";

		undoTile.appendChild(undoSymbol);
		undoTile.appendChild(undoText);

		// Add click handler for undo
		const self = this;
		undoTile.addEventListener("click", () => {
			self.handleUndoClick();
		});

		// Store reference to the undo tile
		this.undoTileElement = undoTile;

		tilesContainer.appendChild(undoTile);

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
		// Store the previous date for undo
		this.undoData = {
			catName: catName,
			previousDate: this.catData[catName]
		};

		this.sendSocketNotification("UPDATE_CAT_DATE", catName);
		this.showUndoTile();
	},

	showUndoTile: function() {
		// Clear any existing timer
		if (this.undoTimer) {
			clearTimeout(this.undoTimer);
		}

		// Show the undo tile
		this.undoVisible = true;
		if (this.undoTileElement) {
			this.undoTileElement.classList.remove("hidden");
		}

		// Hide after 10 seconds
		const self = this;
		this.undoTimer = setTimeout(function() {
			self.undoVisible = false;
			self.undoData = null;
			if (self.undoTileElement) {
				self.undoTileElement.classList.add("hidden");
			}
		}, 10000);
	},

	handleUndoClick: function() {
		if (this.undoData) {
			// Clear the timer
			if (this.undoTimer) {
				clearTimeout(this.undoTimer);
				this.undoTimer = null;
			}

			// Send update with the previous date
			this.sendSocketNotification("UPDATE_CAT_DATE", {
				catName: this.undoData.catName,
				date: this.undoData.previousDate
			});

			// Hide the undo tile
			this.undoVisible = false;
			this.undoData = null;
			if (this.undoTileElement) {
				this.undoTileElement.classList.add("hidden");
			}
		}
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
