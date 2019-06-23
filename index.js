/* eslint-disable no-console */
/* eslint-disable no-mixed-spaces-and-tabs */

const Alexa = require('ask-sdk-core');

const LaunchRequestHandler = {
	canHandle(handlerInput) {
		return handlerInput.requestEnvelope.request.type === `LaunchRequest`;
	},
	handle(handlerInput) {
		return handlerInput.responseBuilder
			.speak(welcomeMessage)
			.reprompt(helpMessage)
			.getResponse();
	}
};

const QuizHandler = {
	canHandle(handlerInput) {
		const request = handlerInput.requestEnvelope.request;
		return request.type === "IntentRequest" &&
			(request.intent.name === "QuizIntent" || request.intent.name === "AMAZON.StartOverIntent");
	},
	handle(handlerInput) {
		const attributesManager = handlerInput.attributesManager;
		const attributes = attributesManager.getSessionAttributes();
		attributes.counter = 0;
		attributes.quizScore = 0;

		const question = askQuestion(attributesManager);

		return handlerInput.responseBuilder
			.speak(startQuizMessage + question)
			.reprompt(question)
			.getResponse();
	}
};

function compareSlots(slots, value) {
	return slots["Capital"].value.toString().toLowerCase() === value.toString().toLowerCase();
}

const QuizAnswerHandler = {
	canHandle(handlerInput) {
		const request = handlerInput.requestEnvelope.request;

		return request.type === 'IntentRequest' &&
			   request.intent.name === 'AnswerIntent';
	},
	handle(handlerInput) {
		const attributesManager = handlerInput.attributesManager;
		const attributes = attributesManager.getSessionAttributes();

		const item = attributes.quizItem;
		const isCorrect = compareSlots(handlerInput.requestEnvelope.request.intent.slots, item.Capital);

		let speakOutput = getSpeechCon(isCorrect);
		if (isCorrect) {
			attributes.quizScore += 1;
			attributesManager.setSessionAttributes(attributes);
		}

		speakOutput += getAnswer(item);
		if (attributes.counter < 10) {
			speakOutput += getCurrentScore(attributes.quizScore, attributes.counter);
			let question = askQuestion(attributesManager);
			speakOutput += question;

			return handlerInput.responseBuilder
				.speak(speakOutput)
				.reprompt(question)
				.getResponse();
		} else {
			speakOutput += getFinalScore(attributes.quizScore, attributes.counter) + exitSkillMessage;
			return handlerInput.responseBuilder
				.speak(speakOutput)
				.getResponse();
		}
	}
};

const RepeatHandler = {
	canHandle(handlerInput) {
		const request = handlerInput.requestEnvelope.request;

		return request.type === 'IntentRequest' &&
			   request.intent.name === 'AMAZON.RepeatHandler';
	},
	handle(handlerInput) {
		const attributes = handlerInput.attributesManager.getSessionAttributes();
		const question = getQuestion(attributes.counter, attributes.quizItem);

		return handlerInput.responseBuilder
			.speak(question)
			.reprompt(question)
			.getResponse();
	}
};

const HelpHandler = {
	canHandle(handlerInput) {
		const request = handlerInput.requestEnvelope.request;
		return request.type === 'IntentRequest' &&
			   request.intent.name === 'AMAZON.HelpHandler';
	},
	handle(handlerInput) {
		return handlerInput.responseBuilder
			.speak(helpMessage)
			.reprompt(helpMessage)
			.getResponse();
	}
};

const ExitHandler = {
	canHandle(handlerInput) {
		const request = handlerInput.requestEnvelope.request;

		return request.type === `IntentRequest` && (
			   request.intent.name === 'AMAZON.StopIntent' ||
			   request.intent.name === 'AMAZON.PauseIntent' ||
			   request.intent.name === 'AMAZON.CancelIntent'
		);
	},
	handle(handlerInput) {
		return handlerInput.responseBuilder
			.speak(exitSkillMessage)
			.getResponse();
	}
};

const SessionEndedRequestHandler = {
	canHandle(handlerInput) {
		return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
	},
	handle(handlerInput) {
		return handlerInput.responseBuilder.getResponse();
	},
};

const ErrorHandler = {
	canHandle() {
		return true;
	},
	handle(handlerInput, error) {
		console.log(`Error handled: ${JSON.stringify(error)}`);
		console.log(`Handler Input: ${JSON.stringify(handlerInput)}`);

		return handlerInput.responseBuilder
			.speak(helpMessage)
			.reprompt(helpMessage)
			.getResponse();
	}
};

const skillBuilder = Alexa.SkillBuilders.custom();
const speechConsCorrect = [ 'Richtig', 'Bingo', 'Bravo' ];
const speechConsWrong = [ 'Oh oh', 'Leider nein', 'Falsch geraten' ];
const data = [
	{ StateName: 'Bayern', Capital: 'München' },
	{ StateName: 'Badem-Württemberg', Capital: 'Stuttgart' },
	{ StateName: 'Saarland', Capital: 'Saarbrücken' },
	{ StateName: 'Rheinland-Pfalz', Capital: 'Mainz' },
	{ StateName: 'Hessen', Capital: 'Wiesbaden' },
	{ StateName: 'Thüringen', Capital: 'Erfurt' },
	{ StateName: 'Sachsen', Capital: 'Dresden' },
	{ StateName: 'Sachsen-Anhalt', Capital: 'Magdeburg' },
	{ StateName: 'Brandenburg', Capital: 'Potsdam' },
	{ StateName: 'Berlin', Capital: 'Berlin' },
	{ StateName: 'Nordrhein-Westfalen', Capital: 'Düsseldorf' },
	{ StateName: 'Niedersachsen', Capital: 'Hannover' },
	{ StateName: 'Bremen', Capital: 'Bremen' },
	{ StateName: 'Schleswig-Holstein', Capital: 'Kiel' },
	{ StateName: 'Hamburg', Capital: 'Hamburg' },
	{ StateName: 'Mecklenburg-Vorpommern', Capital: 'Schwerin' }
];

const welcomeMessage = `Willkommen beim Hauptstadt-Quiz!`;
const startQuizMessage = `OK.  Ich werde dir jetzt ein paar Fragen stellen. `;
const exitSkillMessage = `Danke, dass du das Hauptstadt-Quiz gespielt hast!`;
const helpMessage = `Teste dein Wissen über die Hauptstädte Deutschlands!`;

/* HELPER FUNCTIONS */

function getCurrentScore(score, counter) {
	return `Du hast ${score} von ${counter} Punkten. `;
}

function getFinalScore(score, counter) {
	return `Deine endgültige Punktezahl ist ${score} von ${counter} Punkten. `;
}

function getQuestion(counter, item) {
	return `Hier ist deine ${counter}te Frage.  Was ist die Hauptstadt von ${item.StateName}?`;
}

function getAnswer(item) {
	return `Die Hauptstadt von ${item.StateName} ist ${item.Capital}. `;
}

function getRandom(min, max) {
	return Math.floor((Math.random() * ((max - min) + 1)) + min);
}

function randomArrayEntry(array) {
	return array[getRandom(0, array.length - 1)];
}

function askQuestion(attributesManager) {
	const item = randomArrayEntry(data);

	const attributes = attributesManager.getSessionAttributes();
	attributes.quizItem = item;
	attributes.counter += 1;
	attributesManager.setSessionAttributes(attributes);

	return getQuestion(attributes.counter, item);
}

function getSpeechCon(correct) {
	const item = randomArrayEntry(correct ? speechConsCorrect : speechConsWrong);
	return `<say-as interpret-as='interjection'>${item}! </say-as><break strength='strong'/>`;
}

/* LAMBDA SETUP */
exports.handler = skillBuilder
	.addRequestHandlers(
		LaunchRequestHandler,
		QuizHandler,
		QuizAnswerHandler,
		RepeatHandler,
		HelpHandler,
		ExitHandler,
		SessionEndedRequestHandler
	)
	.addErrorHandlers(ErrorHandler)
	.lambda();
