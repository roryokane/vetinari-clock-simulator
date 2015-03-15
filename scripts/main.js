// start loading sounds without waiting for any event
var sounds = (function(){
	var soundNames = ["tick1", "tock1", "tick2", "tock2"];
	function makeNamedSounds(names, nameToUrlTransformer) {
		var sounds = {};
		names.forEach(function(name) {
			var url = nameToUrlTransformer(name);
			sounds[name] = new Audio(url);
		});
		return sounds;
	}
	return makeNamedSounds(soundNames, function(name) {
		return "sounds/" + name + ".mp3"
	});
})();

jQuery(function() {
	$startTickingButton = $('#start-ticking');
	$stopTickingButton = $('#stop-ticking');
	
	$startTickingButton.click(startTicking);
	$stopTickingButton.click(stopTicking);
	
	var nextTickTimeout = null;
	// initialized in startTicking:
	var playTockNext;
	var millisecondsOfTotalSkew;
	
	var ttc = tickTimingConfig = {
		normalTickDelay: 1000,
		maximumAllowedTotalSkew: 400,
		probabilityOfAccuracyEachTick: 0.5,
		maximumPossibleSkewPerTick: 400,
	};
	if (ttc.maximumPossibleSkewPerTick > ttc.maximumAllowedTotalSkew) {
		console.error("maximumPossibleSkewPerTick may not be greater than maximumAllowedTotalSkew");
	}
	
	updateButtonDisabledStatuses();
	
	
	function updateButtonDisabledStatuses() {
		$startTickingButton.prop("disabled", isCurrentlyTicking());
		$stopTickingButton.prop("disabled", !isCurrentlyTicking());
	}
	
	function playTickAndScheduleNext() {
		playTickOrTockAndToggle();
		
		var skewForNextTick = generateSkewForNextTick();
		millisecondsOfTotalSkew += skewForNextTick;
		var millisecondsToNextTick = ttc.normalTickDelay + skewForNextTick;
		nextTickTimeout = setTimeout(playTickAndScheduleNext, millisecondsToNextTick);
	}
	
	function generateSkewForNextTick() {
		var nextTickShouldBeAccurate = (Math.random() < ttc.probabilityOfAccuracyEachTick);
		if (nextTickShouldBeAccurate) {
			return 0;
		} else {
			return generateSkewForNextTickAssumingNonaccuracy();
		}
	}
	
	function generateSkewForNextTickAssumingNonaccuracy() {
		var potentialSkewForNextTick = _.random(-ttc.maximumPossibleSkewPerTick, ttc.maximumPossibleSkewPerTick);
		var potentialTotalSkew = millisecondsOfTotalSkew + potentialSkewForNextTick;
		if (totalSkewIsWithinAllowedRange(potentialTotalSkew)) {
			return potentialSkewForNextTick;
		} else {
			// reverse the direction of skew to prevent the total skew from being off by too much
			return -potentialSkewForNextTick;
		}
	}
	
	function totalSkewIsWithinAllowedRange(totalSkew) {
		return (-ttc.maximumAllowedTotalSkew < totalSkew && totalSkew < ttc.maximumAllowedTotalSkew);
	}
	
	function startTicking() {
		playTockNext = false;
		millisecondsOfTotalSkew = 0;
		playTickAndScheduleNext();
		updateButtonDisabledStatuses();
	}
	
	function stopTicking() {
		clearTimeout(nextTickTimeout);
		nextTickTimeout = null;
		updateButtonDisabledStatuses();
	}
	
	function isCurrentlyTicking() {
		return nextTickTimeout !== null;
	}
	
	function playTickOrTockAndToggle() {
		if (playTockNext) {
			playTockSound();
		} else {
			playTickSound();
		}
		playTockNext = !playTockNext;
	}
	
	function playTickSound() {
		playSound(_.sample(["tick1", "tick2"]));
	}
	function playTockSound() {
		playSound(_.sample(["tock1", "tock2"]));
	}
	function playSound(name) {
		sounds[name].play();
	}
});
