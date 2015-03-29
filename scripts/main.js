// start loading sounds without waiting for any event
var sounds = (function(){
	function makeNamedSounds(names, nameToUrlsTransformer) {
		var sounds = {};
		names.forEach(function(name) {
			sounds[name] = new Howl({
				urls: nameToUrlsTransformer(name),
			});
		});
		return sounds;
	}
	
	var soundNames = ["tick1", "tock1", "tick2", "tock2"];
	return makeNamedSounds(soundNames, function(name) {
		return ["sounds/wav/" + name + ".wav", "sounds/mp3/" + name + ".mp3"];
	});
})();

function playTickSound() {
	playSound(_.sample(["tick1", "tick2"]));
}
function playTockSound() {
	playSound(_.sample(["tock1", "tock2"]));
}
function playSound(name) {
	var sound = sounds[name];
	sound.stop();
	sound.play();
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
		probabilityOfTogglingTickTock: 0.9,
		probabilityOfSkippingATickWhenPossible: 0.75,
		probabilityOfSkewingPositive: 0.3,
		possibleSkewPerInaccurateTick: {
			minimum: 100,
			maximum: 250,
		},
		maximumAllowedTotalSkew: 1499,
	};
	sanityCheckTickTimingConfig(tickTimingConfig);
	
	updateButtonDisabledStatuses();
	
	
	function sanityCheckTickTimingConfig(ttc) {
		var passedSanityCheck = (
			ttc.normalTickDelay > 0 &&
			ttc.probabilityOfAccuracyEachTick >= 0 && ttc.probabilityOfAccuracyEachTick <= 1 &&
			ttc.probabilityOfTogglingTickTock >= 0 && ttc.probabilityOfTogglingTickTock <= 1 &&
			ttc.probabilityOfSkippingATickWhenPossible >= 0 && ttc.probabilityOfSkippingATickWhenPossible <= 1 &&
			ttc.probabilityOfSkewingPositive >= 0 && ttc.probabilityOfSkewingPositive <= 0.5 &&
			ttc.possibleSkewPerInaccurateTick.minimum >= 0 &&
			ttc.possibleSkewPerInaccurateTick.maximum >= ttc.possibleSkewPerInaccurateTick.minimum &&
			ttc.possibleSkewPerInaccurateTick.maximum <= ttc.maximumAllowedTotalSkew &&
			ttc.maximumAllowedTotalSkew >= ((2*ttc.normalTickDelay + ttc.possibleSkewPerInaccurateTick.maximum) / 2)
		);
		if (!passedSanityCheck) {
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
		var potentialSkippingSkew = generateSkewForSkippingNextTickIgnoringTotalSkew();
		
		var potentialTotalSkew = millisecondsOfTotalSkew + potentialSkippingSkew;
		var isSkippingATickPossible = totalSkewIsWithinAllowedRange(potentialTotalSkew);
		if (isSkippingATickPossible && trueWithProbability(ttc.probabilityOfSkippingATickWhenPossible)) {
			return potentialSkippingSkew;
		} else {
			return generateSkewForInaccurateNonSkippingNextTick();
		}
	}
		
	function generateSkewForInaccurateNonSkippingNextTick() {
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
		var minimumSkew = ttc.possibleSkewPerInaccurateTick.minimum;
		var maximumSkew = ttc.possibleSkewPerInaccurateTick.maximum;
		var absoluteSkew = _.random(minimumSkew, maximumSkew);
		var skewShouldBePositive = trueWithProbability(ttc.probabilityOfSkewingPositive);
		return absoluteSkew * (skewShouldBePositive ? 1 : -1);
	}
	
	function generateSkewForSkippingNextTickIgnoringTotalSkew() {
		var doubleTickDelay = ttc.normalTickDelay * 2;
		var minimumSkew = doubleTickDelay - ttc.possibleSkewPerInaccurateTick.maximum;
		var maximumSkew = doubleTickDelay + ttc.possibleSkewPerInaccurateTick.maximum;
		return _.random(minimumSkew, maximumSkew);
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
		if (trueWithProbability(ttc.probabilityOfTogglingTickTock)) {
			playTockNext = !playTockNext;
		}
	}
});
