import {Action, Observation} from "../util/x";

export interface Trace {
	logState(env: Environment): void
	
}

export class BaseTrace implements Trace {
	states: 
	constructor(t) {
		this.states = [];
		this.actions = [];
		this.observations = [];
		this.rewards = [];
		this.averageReward = [];
		this.models = [];
		this.totalReward = 0;
		this.t = t;
		this.iter = 0;
		this.plots = [AverageRewardPlot];
		this.explored = [];
	}

	logState(env) {
		this.states.push(env.getState());
		this.explored.push(100 * env.visits / env.numStates);
	}

	logAction(a) {
		this.actions.push(a);
	}

	logPercept(e) {
		this.observations.push(e.obs);
		this.totalReward += e.rew;
		this.rewards.push(this.totalReward);
		this.averageReward.push(this.totalReward / (this.iter + 1));
	}

	logModel(agent) {
		return;
	}

	log(agent, env, a, e) {
		this.logModel(agent);
		this.logState(env);
		this.logAction(a);
		this.logPercept(e);
		this.iter++;
	}
}

export class TabularTrace extends BaseTrace {
	constructor(t) {
		super(t);
		this.q_map = [];
		this.jumps = 50;
	}

	logModel(agent) {
		this.models.push(agent.last_q);
		if (agent.lifetime % (this.t / this.jumps) == 0) {
			this.q_map.push(agent.Q.copy());
		}
	}
}

export class BayesTrace extends BaseTrace {
	constructor(t) {
		super(t);
		this.ig = [];
		this.totalInformation = 0;
		this.plots.push(IGPlot);
		this.plans = [];
	}

	logModel(agent) {
		this.totalInformation += agent.informationGain;
		this.ig.push(this.totalInformation);
		this.models.push(Util.arrayCopy(agent.model.weights));
		this.plans.push(agent.plan);
	}
}

export class ThompsonTrace extends BayesTrace {
	constructor(t) {
		super(t);
		this.rhos = [];
	}

	logModel(agent) {
		super.logModel(agent);
		let goal = agent.rho.goals[0];
		this.rhos.push({ x: goal.x, y: goal.y });
	}
}

class MDLTrace extends ThompsonTrace {
	logModel(agent) {
		super.logModel(agent);
		if (this.iter == 0) {
			this.mappings = agent.mappings;
		}
	}
}

class DirichletTrace extends BayesTrace {
	constructor(t) {
		super(t);
		this.params = [];
	}

	logModel(agent) {
		super.logModel(agent);
		let param = [];
		for (let i = 0; i < agent.model.N; i++) {
			param.push(Util.arrayCopy(agent.model.params[i]));
		}

		this.params.push(param);
	}
}

class BayesExpTrace extends BayesTrace {
	constructor(t) {
		super(t);
		this.exploration_phases = [];
	}

	logModel(agent) {
		super.logModel(agent);
		this.exploration_phases.push(agent.explore);
	}
}
