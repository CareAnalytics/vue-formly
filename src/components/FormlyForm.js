export default {
  render(h){
    let children = [];
    if ( !this.customLayout ){
      const self = this;
      children = this.fields.map( function(field){
	return h('formly-field', {
	  key: `formly_${field.key}`,
	  ref: field.key,
	  props: {
	    model: self.model,
	    form: self.form,
	    field: field
	  }
	});
      });
    }
    if ( 'default' in this.$scopedSlots ) children.push( this.$scopedSlots.default({ keys: this.keys }) );
    return h(this.tag ? this.tag : 'fieldset', children);
  },
  methods: {
    validate(){
      return new Promise((resolve, reject) => {
	let target = this.fields.length;
	let count = 0;
	this.fields.forEach( field => {
	  if ( !(field.key in this.form) ) {
	    count++;
	    if( target == count ) resolve();
	    return;
	  }
	  this.$set( this.form[ field.key ], '$dirty', true );
	  let validate;
	  if ( field.key in this.$refs ){
	    validate = this.$refs[ field.key ].validate;
	  } else {
	    this.$children.some( child => {
	      if ( ! ( 'field' in child ) ) return false;
	      if ( child.field.key === field.key ){
		validate = child.validate;
		return true;
	      }
	    });
	  }

	  if ( typeof validate !== 'function' ){
	    count++;
	    if( target == count ) resolve();
	    return;
	  }

	  validate()
	    .then(()=>{
	      count++;
	      if( target == count ) resolve();
	    })
	    .catch((e)=>{
	      reject(e);
	    });
	});
      });
    }
  },
  props: ['form', 'model', 'fields', 'customLayout','tag', 'formStepName'],
  computed:{
    keys(){
      let keys = {};
      this.fields.forEach( field => {
	keys[field.key] = field;
      });
      return keys;
    }
  },
  created(){

    //make sure that the 'value' is always set
    this.fields.forEach( field => {
      if ( typeof this.model[ field.key ] == 'undefined' ) this.$set(this.model, field.key, '');
    });

    //first check if the 'this.form.$errors' and the 'this.form.$valid' object does not exist.
    //only if they do not exist then create the default validation options setup.
    if(typeof this.form.$errors == 'undefined' && typeof this.form.$valid == 'undefined' ){
      
    //set our validation options
    this.$set(this.form, '$errors', {});
    this.$set(this.form, '$valid', true);

    //if a form step name has been declared then set up an object to track validation for a section in a multi-step form.
    if(typeof this.formStepName != 'undefined'){
      //set our validation object for the form steps.
      this.$set(this.form, '$stepValid', {});
    }

    this.$watch('form.$errors', function(val){
      let valid = true;
      Object.keys(this.form.$errors).forEach((key)=>{
        let errField = this.form.$errors[key];
        Object.keys(errField).forEach((errKey) => {
          if ( errField[errKey] ) valid = false;
        })
      });
      this.form.$valid = valid;
    }, {
      deep: true
    });
  }

  if(typeof this.form['$stepValid'] != 'undefined'){
    //set the valid status of a particular form step.
    this.$set(this.form['$stepValid'], this.formStepName, true);
  }

  //this watch function has been added so that the valid status of a form can be set up.
  this.$watch('form.$errors', function(val){
    let stepValid = true;
    let formFieldKeys = this.keys;
    Object.keys(formFieldKeys).forEach((key)=>{
      let errFieldForStep = this.form.$errors[key];
      //check if 'undefined' before proceeding, as the form field may not have had a form field key defined therefore would not have a corresponding 'form.$errors' key.
      if(typeof errFieldForStep != 'undefined'){
        Object.keys(errFieldForStep).forEach((errKey) => {
          if ( errFieldForStep[errKey] ) stepValid = false;
        })
      }
    })
    this.form['$stepValid'][this.formStepName] = stepValid;
  }, {
    deep: true
  });
    
  }
}
