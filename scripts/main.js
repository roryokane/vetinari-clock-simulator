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

function playTickSound() {
	playSound(_.sample(["tick1", "tick2"]));
}
function playTockSound() {
	playSound(_.sample(["tock1", "tock2"]));
}
function playSound(name) {
	sounds[name].play();
}

function trueWithProbability(probability) {
	return (Math.random() < probability);
}

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
		probabilityOfAccuracyEachTick: 0.75,
		possibleSkewPerInaccurateTick: {
			minimum: 50,
			maximum: 250,
		},
		maximumAllowedTotalSkew: 999,
	};
	sanityCheckTickTimingConfig(tickTimingConfig);
	
	updateButtonDisabledStatuses();
	
	
	function sanityCheckTickTimingConfig(ttc) {
		if (ttc.normalTickDelay <= 0 ||
		    ttc.probabilityOfAccuracyEachTick < 0 || ttc.probabilityOfAccuracyEachTick > 1 ||
		    ttc.possibleSkewPerInaccurateTick.minimum < 0 ||
		    ttc.possibleSkewPerInaccurateTick.maximum < ttc.possibleSkewPerInaccurateTick.minimum ||
		    ttc.possibleSkewPerInaccurateTick.maximum > ttc.maximumAllowedTotalSkew) {
			throw "tickTimingConfig failed sanity check";
		}
	}
	
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
		var nextTickShouldBeAccurate = trueWithProbability(ttc.probabilityOfAccuracyEachTick);
		if (nextTickShouldBeAccurate) {
			return 0;
		} else {
			return generateSkewForInaccurateNextTick();
		}
	}
	
	function generateSkewForInaccurateNextTick() {
		var potentialSkew = generateSkewForInaccurateNextTickIgnoringTotalSkew();
		
		var potentialTotalSkew = millisecondsOfTotalSkew + potentialSkew;
		if (totalSkewIsWithinAllowedRange(potentialTotalSkew)) {
			return potentialSkew;
		} else {
			// reverse the direction of skew to prevent the total skew from being off by too much
			return -potentialSkew;
		}
	}
	
	function generateSkewForInaccurateNextTickIgnoringTotalSkew() {
		var minimum = ttc.possibleSkewPerInaccurateTick.minimum;
		var maximum = ttc.possibleSkewPerInaccurateTick.maximum;
		var absoluteSkew = _.random(minimum, maximum);
		var skewShouldBePositive = trueWithProbability(0.5);
		return absoluteSkew * (skewShouldBePositive ? 1 : -1);
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
});
