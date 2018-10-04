import { EventEmitter, Injectable, Optional } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormioResourceConfig } from './resource.config';
import { FormioResources, FormioResourceMap } from './resources.service';
import { FormioLoader } from '../components/loader/formio.loader';
import { FormioAppConfig } from '../formio.config';
import { FormioRefreshValue } from '../formio.common';
import Promise from 'native-promise-only';
// <<<<<<< HEAD
// import { Formio } from 'formiojs-proyectoscolfuturo';
// import FormioUtils from 'formiojs-proyectoscolfuturo/utils';
// =======
import { Formio, Utils } from 'formiojs-proyectoscolfuturo';
import _ from 'lodash';
// >>>>>>> upstream/master

@Injectable()
export class FormioResourceService {
  public form: any;
  public resource: any;
  public resourceUrl?: string;
  public formUrl: string;
  public formFormio: any;
  public formio: any;
  public refresh: EventEmitter<FormioRefreshValue> = new EventEmitter();

  public resourceLoading?: Promise<any>;
  public resourceLoaded?: Promise<any>;
  public resourceResolve: any;
  public resourceReject: any;
  public resourceId?: string;
  public resources: any;

  public formLoading?: Promise<any>;
  public formLoaded: Promise<any> = new Promise(() => {});
  public formResolve: any;
  public formReject: any;

  public parentsLoaded?: Promise<any>;
  public parentsResolve: any;
  public parentsReject: any;

  constructor(
    public appConfig: FormioAppConfig,
    public config: FormioResourceConfig,
    public loader: FormioLoader,
    @Optional() public resourcesService: FormioResources
  ) {
    if (this.appConfig && this.appConfig.appUrl) {
      Formio.setBaseUrl(this.appConfig.apiUrl);
      Formio.setProjectUrl(this.appConfig.appUrl);
      Formio.formOnly = this.appConfig.formOnly;
    } else {
      console.error('You must provide an AppConfig within your application!');
    }

    // Create the form url and load the resources.
    this.formUrl = this.appConfig.appUrl + '/' + this.config.form;
    this.refresh = new EventEmitter();
    this.resource = { data: {} };
    this.resourceLoaded = new Promise((resolve: any, reject: any) => {
      this.resourceResolve = resolve;
      this.resourceReject = reject;
    });
    this.formLoaded = new Promise((resolve: any, reject: any) => {
      this.formResolve = resolve;
      this.formReject = reject;
    });
    this.parentsLoaded = new Promise((resolve: any, reject: any) => {
      this.parentsResolve = resolve;
      this.parentsReject = reject;
    });

    // Add this resource service to the list of all resources in context.
    if (this.resourcesService) {
      this.resources = this.resourcesService.resources;
      this.resources[this.config.name] = this;
    }

    this.loadForm();
  }

  initialize() {
    console.warn('FormioResourceService.initialize() has been deprecated.');
  }

  onError(error: any) {
    if (this.resourcesService) {
      this.resourcesService.error.emit(error);
    }
    throw error;
  }

  onFormError(err: any) {
    this.formReject(err);
    this.onError(err);
  }

  setContext(route: ActivatedRoute) {
    this.resourceId = route.snapshot.params['id'];
    this.resource = { data: {} };
    this.resourceUrl = this.appConfig.appUrl + '/' + this.config.form;
    if (this.resourceId) {
      this.resourceUrl += '/submission/' + this.resourceId;
    }
    this.formio = new Formio(this.resourceUrl);
    this.setParents();
  }

  loadForm() {
    this.formFormio = new Formio(this.formUrl);
    this.loader.loading = true;
    this.formLoading = this.formFormio
      .loadForm()
      .then(
        (form: any) => {
          this.form = form;
          this.formResolve(form);
          this.loader.loading = false;
          this.setParents();
          return form;
        },
        (err: any) => this.onFormError(err)
      )
      .catch((err: any) => this.onFormError(err));
    return this.formLoading;
  }

  setParents() {
    if (!this.config.parents || !this.config.parents.length || !this.form) {
      return;
    }

    if (!this.resourcesService) {
      console.warn(
        'You must provide the FormioResources within your application to use nested resources.'
      );
      return;
    }

    // Iterate through the list of parents.
    const _parentsLoaded: Array<Promise<any>> = [];
    this.config.parents.forEach((parent: any) => {
      const resourceName = parent.resource || parent;
      const resourceField = parent.field || parent;
      const filterResource = parent.hasOwnProperty('filter') ? parent.filter : true;
      if (this.resources.hasOwnProperty(resourceName)) {
        _parentsLoaded.push(
          this.resources[resourceName].resourceLoaded.then((resource: any) => {
            let parentPath = '';
            Utils.eachComponent(this.form.components, (component, path) => {
              if (component.key === resourceField) {
                component.hidden = true;
                component.clearOnHide = false;
                _.set(this.resource.data, path, resource);
                parentPath = path;
                return true;
              }
            });
            return {
              name: parentPath,
              filter: filterResource,
              resource
            };
          })
        );
      }
    });

    // When all the parents have loaded, emit that to the onParents emitter.
    Promise.all(_parentsLoaded).then((parents: any) => {
      this.parentsResolve(parents);
      this.refresh.emit({
        form: this.form,
        submission: this.resource
      });
    });
  }

  onSubmissionError(err: any) {
    this.resourceReject(err);
    this.onError(err);
  }

  loadResource(route: ActivatedRoute) {
    this.setContext(route);
    this.loader.loading = true;
    this.resourceLoading = this.formio
      .loadSubmission(null, {ignoreCache: true})
      .then(
        (resource: any) => {
          this.resource = resource;
          this.resourceResolve(resource);
          this.loader.loading = false;
          this.refresh.emit({
            property: 'submission',
            value: this.resource
          });
          return resource;
        },
        (err: any) => this.onSubmissionError(err)
      )
      .catch((err: any) => this.onSubmissionError(err));
    return this.resourceLoading;
  }

  save(resource: any) {
    const formio = resource._id ? this.formio : this.formFormio;
    return formio
      .saveSubmission(resource)
      .then(
        (saved: any) => {
          this.resource = saved;
          return saved;
        },
        (err: any) => this.onError(err)
      )
      .catch((err: any) => this.onError(err));
  }

  remove() {
    return this.formio
      .deleteSubmission()
      .then(
        () => {
          this.resource = null;
        },
        (err: any) => this.onError(err)
      )
      .catch((err: any) => this.onError(err));
  }
}
