import { ajax } from 'discourse/lib/ajax';
import { extractError } from 'discourse/lib/ajax-error';
//import computed from 'ember-addons/ember-computed-decorators';

export default Ember.Controller.extend({
	application: Ember.inject.controller(),
	ajaxPending: false,
	opuslinkLoadError: null,
	opuslinkLoadResult: null,
	opuslinkRegCodeShowMe: false,
	opuslinkRegCodeExample: false,
	opuslinkRegCodeInput: "",

	startLinkQuery() {

		if (this.get("ajaxPending")) {
			return;
		}

		if (window.location.protocol !== "https:" && Discourse.Environment !== "development") {
			this.set("opuslinkLoadError", "Submission over http:// is not secure. Please use the site's https:// URL");
			return;
		}

		const userModel = this.get("model");
		if (typeof userModel === "undefined") {
			return;
		}
		const username = userModel.get("username");
		const userid = userModel.get("id");
		
		this.set("ajaxPending",true);

		// Start the ajax/json request, which is async.
		// When/if it finishes successfully, store the json results on the model.
		// If it fails, set a failure error message that is displayed instead.
		ajax("/users/" + username + "/link-opus.json?user_id=" + userid, { type: 'GET', cache: false }).
			then(jsonResult => this.onLinkQuerySuccess(jsonResult)).
			catch(ajaxError => this.onLinkQueryFailure(ajaxError));
	},

	onLinkQuerySuccess(jsonResult) {
		this.set("opuslinkRegCodeExample", false);
		this.set("opuslinkLoadError", null);
		this.set("opuslinkLoadResult", jsonResult);
		this.set("ajaxPending",false);
	},

	onLinkQueryFailure(ajaxError) {
		this.set("opuslinkRegCodeExample", false);
		this.set("opuslinkLoadError", extractError(ajaxError));
		this.set("opuslinkLoadResult", null);
		this.set("ajaxPending",false);
	},

	getRegCode() {
		const regCodeOrig = this.get("opuslinkRegCodeInput");
		if (typeof regCodeOrig !== "string") {
			return null;
			}
		// Trim spaces, convert to uppercase, and add the dashes if any are missing.
		// The server side is much more strict, as it expects us to have done this already.
		var regCode = regCodeOrig.trim().toUpperCase().replace(/^([A-Z0-9]{5})-?([A-Z0-9]{5})-?([A-Z0-9]{5})-?([A-Z0-9]{5})$/, "$1-$2-$3-$4");
		if (regCode !== regCodeOrig) {
			this.set("opuslinkRegCodeInput", regCode);
		}
		return regCode;
	},

	validateRegCode(regCode) {
		if (typeof regCode !== "string") {
			return false;
		}
		if (! /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/.test(regCode) ) {
			return false;
		}
		return true;
	},
	
	actions: {
		onOpusLinkSubmitRegCode() {
			if (this.get("ajaxPending")) {
				return;
			}
			const regCode = this.getRegCode();
			if (!this.validateRegCode(regCode)) {
				this.set("opuslinkLoadResult.remote_error", "\"" + regCode + "\" is not the correct format for a registration code.");
				this.set("opuslinkRegCodeExample", true);
				return;
			}
			if (regCode === "ABC12-DE3FG-4HIJ5-KL6M7") {
				this.set("opuslinkLoadResult.remote_error", "You can't use the example registration code. It's just an example. Don't be silly.");
				this.set("opuslinkRegCodeExample", false);
				return;
			}
			this.set("opuslinkLoadResult.remote_error", null);
			this.set("opuslinkRegCodeExample", false);
			alert("Submitting: " + regCode);
		}
	},
});
