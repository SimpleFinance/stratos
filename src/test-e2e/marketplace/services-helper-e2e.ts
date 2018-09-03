import { browser, promise } from 'protractor';

import { CFResponse, createEmptyCfResponse } from '../../frontend/app/store/types/api.types';
import { e2e, E2ESetup } from '../e2e';
import { CFHelpers } from '../helpers/cf-helpers';
import { CFRequestHelpers } from '../helpers/cf-request-helpers';
import { CreateServiceInstance } from './create-service-instance.po';

export class ServicesHelperE2E {

  cfRequestHelper: CFRequestHelpers;
  cfHelper: CFHelpers;
  createServiceInstance: CreateServiceInstance;
  serviceInstanceName: string;

  constructor(public e2eSetup: E2ESetup, createServiceInstance: CreateServiceInstance = null) {
    this.cfRequestHelper = new CFRequestHelpers(e2eSetup);
    this.cfHelper = new CFHelpers(e2eSetup);
    const testTime = (new Date()).toISOString();
    this.serviceInstanceName = `serviceInstance-${testTime}`;
    if (!!createServiceInstance) {
      this.createServiceInstance = createServiceInstance;
    }
  }

  addPrefixToServiceName = (prefix: string) => {
    this.serviceInstanceName = `${prefix}-${this.serviceInstanceName}`;
  }
  setCreateServiceInstance = (createServiceInstance: CreateServiceInstance) => {
    this.createServiceInstance = createServiceInstance;
  }

  fetchServices = (cfGuid: string): promise.Promise<CFResponse> => {
    return this.cfRequestHelper.sendCfGet(
      cfGuid,
      'services?page=1&results-per-page=100&inline-relations-depth=1&include-relations=service_plans'
    );
  }

  fetchServicesInstances = (cfGuid: string): promise.Promise<CFResponse> => {
    return this.cfRequestHelper.sendCfGet(
      cfGuid,
      'service_instances?page=1&results-per-page=100'
    );
  }

  deleteServiceInstance = (cfGuid: string, serviceGuid: string): promise.Promise<CFResponse> => {
    return this.cfRequestHelper.sendCfDelete(
      cfGuid,
      `service_instances/${serviceGuid}?async=false&recursive=true`
    );
  }

  createService = (serviceName: string, marketplaceMode = false, bindApp: string = null) => {
    this.createServiceInstance.waitForPage();

    // Select CF/Org/Space
    this.setCfOrgSpace(null, null, marketplaceMode);
    this.createServiceInstance.stepper.next();

    // Select Service
    if (!marketplaceMode) {
       // Select Service
       this.setServiceSelection(serviceName);
       this.createServiceInstance.stepper.next();
     }

     // Select Service Plan
     this.setServicePlan();
     this.createServiceInstance.stepper.next();

    // Bind App
    this.createServiceInstance.stepper.isBindAppStepDisabled().then(bindAppDisabled => {
      if (!bindAppDisabled) {
        this.setBindApp(bindApp);
        this.createServiceInstance.stepper.next();
      }

      this.setServiceInstanceDetail();

      this.createServiceInstance.stepper.next();
    });
  }
  canBindAppStep = (): promise.Promise<boolean> => {
    return this.cfHelper.fetchDefaultSpaceGuid(true)
      .then(spaceGuid => this.cfHelper.fetchAppsCountInSpace(this.cfHelper.cachedDefaultCfGuid, spaceGuid))
      .then(totalAppsInSpace => !!totalAppsInSpace);
  }

  setServiceInstanceDetail = (isEditServiceInstance = false) => {
    this.createServiceInstance.stepper.waitForStep('Service Instance');
    expect(this.createServiceInstance.stepper.canPrevious()).toBeTruthy();
    if (!isEditServiceInstance) {
      expect(this.createServiceInstance.stepper.canNext()).toBeFalsy();
    } else {
      expect(this.createServiceInstance.stepper.canNext()).toBeTruthy();
    }
    expect(this.createServiceInstance.stepper.canCancel()).toBeTruthy();
    this.createServiceInstance.stepper.setServiceName(this.serviceInstanceName);
  }

  setBindApp = (bindApp: string = null) => {
    this.createServiceInstance.stepper.waitForStep('Bind App (Optional)');

    if (!!bindApp) {
      this.createServiceInstance.stepper.setBindApp(bindApp);
    }
    expect(this.createServiceInstance.stepper.canPrevious()).toBeTruthy();
    expect(this.createServiceInstance.stepper.canNext()).toBeTruthy();
    expect(this.createServiceInstance.stepper.canCancel()).toBeTruthy();
  }

  setServicePlan = (isEditServiceInstance = false) => {
    this.createServiceInstance.stepper.waitForStep('Select Plan');
    // Should have a plan auto-selected
    if (!isEditServiceInstance) {
      expect(this.createServiceInstance.stepper.canPrevious()).toBeTruthy();
    } else {
      expect(this.createServiceInstance.stepper.canPrevious()).toBeFalsy();
    }
    expect(this.createServiceInstance.stepper.canNext()).toBeTruthy();
    expect(this.createServiceInstance.stepper.canCancel()).toBeTruthy();
  }

  setServiceSelection = (serviceName: string, expectFailure = false) => {
    expect(this.createServiceInstance.stepper.canPrevious()).toBeTruthy();
    expect(this.createServiceInstance.stepper.canNext()).toBeFalsy();
    this.createServiceInstance.stepper.waitForStep('Select Service');
    this.createServiceInstance.stepper.setService(serviceName, expectFailure);
    if (!expectFailure) {
      expect(this.createServiceInstance.stepper.canNext()).toBeTruthy();
      expect(this.createServiceInstance.stepper.canCancel()).toBeTruthy();
    }
  }

  setCfOrgSpace = (orgName: string = null, spaceName: string = null, marketplaceMode = false) => {

    if (!marketplaceMode) {
      this.createServiceInstance.stepper.setCf(e2e.secrets.getDefaultCFEndpoint().name);
    }
    this.createServiceInstance.stepper.setOrg(!!orgName ? orgName : e2e.secrets.getDefaultCFEndpoint().testOrg);
    this.createServiceInstance.stepper.setSpace(!!spaceName ? spaceName : e2e.secrets.getDefaultCFEndpoint().testSpace);
    expect(this.createServiceInstance.stepper.canNext()).toBeTruthy();
    expect(this.createServiceInstance.stepper.canCancel()).toBeTruthy();
  }

  cleanUpServiceInstance(serviceInstanceName: string): promise.Promise<any> {
    const getCfCnsi = this.cfRequestHelper.getCfGuid();
    let cfGuid: string;
    return getCfCnsi.then(guid => {
      cfGuid = guid;
      return this.fetchServicesInstances(cfGuid);
    }).then(response => {
      const services = response.resources;
      const serviceInstance = services.filter(service => service.entity.name === serviceInstanceName)[0];
      if (serviceInstance) {
        return this.deleteServiceInstance(cfGuid, serviceInstance.metadata.guid);
      }
      return promise.fullyResolved(createEmptyCfResponse());
    });
  }

}
