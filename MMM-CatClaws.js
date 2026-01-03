Module.register("MMM-CatClaws", {
	defaults: {
		cats: [],
		overdueDays: 8,
		tileSize: 140,
		undoTimeout: 10000
	},

	start: function() {
		Log.info("Starting module: " + this.name);
		this.loaded = false;
		this.catData = {};
		this.previousCats = [];
		this.undoData = {}; // Hash of {catName: previousDate} for undo
		this.undoVisible = false;
		this.undoTimer = null;
		this.undoTileElement = null; // Store reference to undo tile DOM element
		this.initializeData();
		this.scheduleUpdate();
	},

	initializeData: function() {
		this.sendSocketNotification("INIT_DATA", this.config.cats);
	},

	getDaysDifference: function(dateString) {
		if (!dateString) return null;

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		// Parse date string as local time to avoid timezone issues
		const [year, month, day] = dateString.split('-').map(Number);
		const catDate = new Date(year, month - 1, day);

		const diffTime = today - catDate;
		return Math.floor(diffTime / (1000 * 60 * 60 * 24));
	},

	formatDateDifference: function(dateString) {
		if (!dateString) return "Loading...";

		const diffDays = this.getDaysDifference(dateString);

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
		wrapper.style.setProperty("--tile-size", this.config.tileSize + "px");

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

			// Check if date is overdue and apply CSS class
			const daysDiff = this.getDaysDifference(this.catData[cat]);
			if (daysDiff !== null && daysDiff >= this.config.overdueDays) {
				catDate.classList.add("overdue");
			}

			tile.appendChild(catName);
			tile.appendChild(catDate);

			// Add click handler to update date
			tile.addEventListener("click", () => {
				this.handleTileClick(cat);
			});

			tilesContainer.appendChild(tile);
		});

		// Add undo tile only if undo functionality is enabled
		if (this.config.undoTimeout !== 0) {
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
		}

		wrapper.appendChild(tilesContainer);
		return wrapper;
	},

	getStyles: function() {
		return ["MMM-CatClaws.css"];
	},

	scheduleUpdate: function() {
		const self = this;

		// Calculate milliseconds until the next top of the minute
		const now = new Date();
		const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

		// Function to perform the update
		function doUpdate() {
			// Check if config changed
			if (JSON.stringify(self.config.cats) !== JSON.stringify(self.previousCats)) {
				self.previousCats = [...self.config.cats];
				self.initializeData();
			}
			self.updateDom();
		}

		// Schedule first update at the top of the next minute
		setTimeout(function() {
			doUpdate();
			// Then continue updating every minute
			setInterval(doUpdate, 60000);
		}, msUntilNextMinute);

		this.loaded = true;
		this.previousCats = [...this.config.cats];
		this.updateDom();
	},

	handleTileClick: function(catName) {
		// Store the previous date for undo (only if not already stored)
		if (!(catName in this.undoData)) {
			this.undoData[catName] = this.catData[catName];
		}

		this.sendSocketNotification("UPDATE_CAT_DATE", catName);
		this.showUndoTile();
	},

	showUndoTile: function() {
		// If undo timeout is 0, don't show undo functionality
		if (this.config.undoTimeout === 0) {
			return;
		}

		// Clear any existing timer
		if (this.undoTimer) {
			clearTimeout(this.undoTimer);
		}

		// Show the undo tile
		this.undoVisible = true;
		if (this.undoTileElement) {
			this.undoTileElement.classList.remove("hidden");
		}

		// Hide after configured timeout
		const self = this;
		this.undoTimer = setTimeout(function() {
			self.undoVisible = false;
			self.undoData = {};
			if (self.undoTileElement) {
				self.undoTileElement.classList.add("hidden");
			}
		}, this.config.undoTimeout);
	},

	handleUndoClick: function() {
		if (Object.keys(this.undoData).length > 0) {
			// Clear the timer
			if (this.undoTimer) {
				clearTimeout(this.undoTimer);
				this.undoTimer = null;
			}

			// Restore all cats to their previous dates
			for (const catName in this.undoData) {
				this.sendSocketNotification("UPDATE_CAT_DATE", {
					catName: catName,
					date: this.undoData[catName]
				});
			}

			// Hide the undo tile
			this.undoVisible = false;
			this.undoData = {};
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
