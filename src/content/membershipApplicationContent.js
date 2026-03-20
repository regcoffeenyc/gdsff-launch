const membershipTypeOptions = {
  en: [
    { value: 'athlete', label: 'Athlete' },
    { value: 'coach', label: 'Coach' },
    { value: 'club-representative', label: 'Club Representative' },
    { value: 'supporter', label: 'Supporter' },
    { value: 'other', label: 'Other' },
  ],
  ka: [
    { value: 'athlete', label: 'სპორტსმენი' },
    { value: 'coach', label: 'მწვრთნელი' },
    { value: 'club-representative', label: 'კლუბის წარმომადგენელი' },
    { value: 'supporter', label: 'მხარდამჭერი' },
    { value: 'other', label: 'სხვა' },
  ],
}

const sportInterestOptions = {
  en: [
    { value: 'dynamic-shooting', label: 'Dynamic Shooting' },
    { value: 'functional-fitness', label: 'Functional Fitness' },
    { value: 'both', label: 'Both' },
  ],
  ka: [
    { value: 'dynamic-shooting', label: 'დინამიური სროლა' },
    { value: 'functional-fitness', label: 'ფუნქციური ფიტნესი' },
    { value: 'both', label: 'ორივე' },
  ],
}

const fieldGroups = {
  en: [
    {
      id: 'identity',
      title: 'Personal Information',
      text: 'Enter the official identity details that will appear on the federation membership application record.',
      fields: ['fullName', 'birthDate', 'personalId', 'citizenship'],
    },
    {
      id: 'contact',
      title: 'Contact Details',
      text: 'Use current contact information so the federation can review the application and follow up directly.',
      fields: ['address', 'phone', 'email'],
    },
    {
      id: 'membership',
      title: 'Membership Profile',
      text: 'Select the membership category and sport direction that best matches the applicant profile.',
      fields: ['membershipType', 'sportInterest', 'additionalInfo'],
    },
  ],
  ka: [
    {
      id: 'identity',
      title: 'პერსონალური ინფორმაცია',
      text: 'შეიყვანეთ ოფიციალური პირადი მონაცემები, რომლებიც ფედერაციის წევრობის განაცხადის ჩანაწერში დაფიქსირდება.',
      fields: ['fullName', 'birthDate', 'personalId', 'citizenship'],
    },
    {
      id: 'contact',
      title: 'საკონტაქტო ინფორმაცია',
      text: 'მიუთითეთ აქტიური საკონტაქტო მონაცემები, რათა ფედერაციამ განაცხადის განხილვისას პირდაპირ დაგიკავშირდეთ.',
      fields: ['address', 'phone', 'email'],
    },
    {
      id: 'membership',
      title: 'წევრობის პროფილი',
      text: 'აირჩიეთ წევრობის კატეგორია და სპორტული მიმართულება, რომელიც საუკეთესოდ შეესაბამება აპლიკანტს.',
      fields: ['membershipType', 'sportInterest', 'additionalInfo'],
    },
  ],
}

const fields = {
  en: [
    {
      name: 'fullName',
      label: 'Full Name',
      type: 'text',
      autoComplete: 'name',
      placeholder: 'Enter full legal name',
    },
    {
      name: 'birthDate',
      label: 'Date of Birth',
      type: 'date',
      autoComplete: 'bday',
    },
    {
      name: 'personalId',
      label: 'Personal ID Number',
      type: 'text',
      autoComplete: 'off',
      inputMode: 'numeric',
      placeholder: 'Enter personal ID number',
    },
    {
      name: 'citizenship',
      label: 'Citizenship',
      type: 'text',
      autoComplete: 'country-name',
      placeholder: 'Enter citizenship',
    },
    {
      name: 'address',
      label: 'Address',
      type: 'textarea',
      autoComplete: 'street-address',
      rows: 4,
      placeholder: 'Enter full address',
    },
    {
      name: 'phone',
      label: 'Phone Number',
      type: 'tel',
      autoComplete: 'tel',
      inputMode: 'tel',
      placeholder: 'Enter active phone number',
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      autoComplete: 'email',
      placeholder: 'Enter email address',
    },
    {
      name: 'membershipType',
      label: 'Membership Type',
      type: 'select',
      options: membershipTypeOptions.en,
      placeholder: 'Select membership type',
    },
    {
      name: 'sportInterest',
      label: 'Sport Interest',
      type: 'select',
      options: sportInterestOptions.en,
      placeholder: 'Select sport direction',
    },
    {
      name: 'additionalInfo',
      label: 'Additional Information',
      type: 'textarea',
      required: false,
      rows: 5,
      placeholder: 'Add relevant club details, background, or application notes',
    },
  ],
  ka: [
    {
      name: 'fullName',
      label: 'სახელი და გვარი',
      type: 'text',
      autoComplete: 'name',
      placeholder: 'შეიყვანეთ სრული სახელი და გვარი',
    },
    {
      name: 'birthDate',
      label: 'დაბადების თარიღი',
      type: 'date',
      autoComplete: 'bday',
    },
    {
      name: 'personalId',
      label: 'პირადი ნომერი',
      type: 'text',
      autoComplete: 'off',
      inputMode: 'numeric',
      placeholder: 'შეიყვანეთ პირადი ნომერი',
    },
    {
      name: 'citizenship',
      label: 'მოქალაქეობა',
      type: 'text',
      autoComplete: 'country-name',
      placeholder: 'შეიყვანეთ მოქალაქეობა',
    },
    {
      name: 'address',
      label: 'მისამართი',
      type: 'textarea',
      autoComplete: 'street-address',
      rows: 4,
      placeholder: 'შეიყვანეთ სრული მისამართი',
    },
    {
      name: 'phone',
      label: 'ტელეფონის ნომერი',
      type: 'tel',
      autoComplete: 'tel',
      inputMode: 'tel',
      placeholder: 'შეიყვანეთ აქტიური ტელეფონის ნომერი',
    },
    {
      name: 'email',
      label: 'ელფოსტა',
      type: 'email',
      autoComplete: 'email',
      placeholder: 'შეიყვანეთ ელფოსტის მისამართი',
    },
    {
      name: 'membershipType',
      label: 'წევრობის ტიპი',
      type: 'select',
      options: membershipTypeOptions.ka,
      placeholder: 'აირჩიეთ წევრობის ტიპი',
    },
    {
      name: 'sportInterest',
      label: 'სპორტული მიმართულება',
      type: 'select',
      options: sportInterestOptions.ka,
      placeholder: 'აირჩიეთ სპორტული მიმართულება',
    },
    {
      name: 'additionalInfo',
      label: 'დამატებითი ინფორმაცია',
      type: 'textarea',
      required: false,
      rows: 5,
      placeholder: 'დაამატეთ კლუბის, გამოცდილების ან განაცხადის შესახებ დამატებითი ინფორმაცია',
    },
  ],
}

export const membershipApplicationContent = {
  en: {
    heroHighlights: ['Live online registration', 'Bilingual application', 'Official form download'],
    introKicker: 'Online Membership Registration',
    introTitle: 'Apply online and send a real membership application to the federation register.',
    introText:
      'The online form below stores each submitted application in the federation registration system and keeps the official downloadable document available as a separate option.',
    statsKicker: 'Membership Count',
    statsTitle: 'Live application count from the website register.',
    statsText:
      'The total updates from real submitted applications stored by the membership registration workflow, not from hardcoded text.',
    totalApplicationsLabel: 'Total Member Applications',
    totalApplicationsShortLabel: 'Applications',
    lastSubmittedLabel: 'Last submission',
    statsLoadingText: 'Checking the current membership register...',
    statsOfflineText: 'The live counter is temporarily unavailable. The downloadable form remains available.',
    statusLabels: {
      submitted: 'Submitted',
      'under-review': 'Under Review',
      approved: 'Approved',
      'needs-info': 'Needs Info',
      closed: 'Closed',
    },
    processKicker: 'Review Workflow',
    processTitle: 'Online registrations are stored for federation review and follow-up.',
    processText:
      'Each submission is saved into the membership application register with a reference number, submission date, selected membership type, and current status.',
    processSteps: [
      'Complete the bilingual online registration form and confirm the required statements.',
      'Submit the form to store the application directly in the federation membership register.',
      'The federation reviews the application and follows up using the provided contact details.',
    ],
    supportKicker: 'Download Official Form',
    supportTitle: 'Keep the official document route available.',
    supportText:
      'Applicants can still download the official membership application form and submit it separately when a document workflow is required.',
    supportNote:
      'Both the online system and the downloadable form remain active on the same membership page for official federation use.',
    recordKicker: 'Stored Submission Record',
    recordTitle: 'Latest saved application',
    recordText:
      'After a successful submission, the latest stored application reference and current review status are shown here.',
    recordEmptyText: 'No online application has been submitted from this session yet.',
    reviewNoteTitle: 'Review Note',
    reviewNoteText:
      'Online submissions enter the federation review queue. Final membership approval remains subject to internal review and confirmation.',
    formKicker: 'Applicant Details',
    formTitle: 'Membership Registration Form',
    formText: 'Complete every required field before submitting the application to the live membership register.',
    groups: fieldGroups.en,
    fields: fields.en,
    consentTitle: 'Required Confirmations',
    consentText: 'Please accept all three confirmations before submitting your registration.',
    consentItems: [
      'I confirm that the information provided is accurate.',
      "I agree to the federation's rules and internal procedures.",
      'I consent to being contacted regarding my application.',
    ],
    validationTitle: 'Registration Incomplete',
    validationText: 'Please complete all required fields and accept all required confirmations.',
    submitSuccessTitle: 'Application Submitted',
    submitSuccessText:
      'Your membership application has been stored in the federation registration system and assigned a live reference number.',
    submitSuccessHint:
      'The federation can now review this record directly. You may also keep the downloadable form for parallel document handling if needed.',
    submitErrorTitle: 'Submission Unavailable',
    submitErrorText:
      'The online registration system could not store the application right now. Please try again or use the downloadable membership form while the live service is unavailable.',
    resetLabel: 'Clear Form',
    submitLabel: 'Submit Registration',
    summaryLabel: 'Stored Application Summary',
    referenceLabel: 'Reference',
    storedAtLabel: 'Stored At',
    downloadActionLabel: 'Download Membership Form',
    onlineOptionLabel: 'Online Registration',
    documentOptionLabel: 'Official Downloadable Form',
  },
  ka: {
    heroHighlights: ['ონლაინ რეგისტრაცია', 'ორენოვანი განაცხადი', 'ოფიციალური ფორმის ჩამოტვირთვა'],
    introKicker: 'ონლაინ წევრობის რეგისტრაცია',
    introTitle: 'შეავსეთ ონლაინ განაცხადი და გააგზავნეთ რეალური წევრობის განაცხადი ფედერაციის რეესტრში.',
    introText:
      'ქვემოთ მოცემული ონლაინ ფორმა თითოეულ გაგზავნილ განაცხადს ფედერაციის წევრობის რეგისტრაციის სისტემაში ინახავს და ამავე დროს ოფიციალური ჩამოსატვირთი დოკუმენტი ცალკე ვარიანტად ხელმისაწვდომს ტოვებს.',
    statsKicker: 'წევრობის რაოდენობა',
    statsTitle: 'ვებ-რეგისტრიდან მიღებული ცოცხალი განაცხადების რაოდენობა.',
    statsText:
      'სულ რაოდენობა განახლდება რეალურად შენახული ონლაინ განაცხადების მიხედვით და არა ფიქსირებული ტექსტით.',
    totalApplicationsLabel: 'სულ წევრობის განაცხადები',
    totalApplicationsShortLabel: 'განაცხადები',
    lastSubmittedLabel: 'ბოლო გაგზავნა',
    statsLoadingText: 'მიმდინარეობს წევრობის რეესტრის შემოწმება...',
    statsOfflineText: 'ცოცხალი მთვლელი დროებით მიუწვდომელია. წევრობის ჩამოსატვირთი ფორმა კვლავ ხელმისაწვდომია.',
    statusLabels: {
      submitted: 'გაგზავნილია',
      'under-review': 'განხილვაშია',
      approved: 'დამტკიცებულია',
      'needs-info': 'სჭირდება დამატებითი ინფორმაცია',
      closed: 'დახურულია',
    },
    processKicker: 'განხილვის პროცესი',
    processTitle: 'ონლაინ რეგისტრაციები ინახება ფედერაციის განხილვისა და შემდგომი კომუნიკაციისთვის.',
    processText:
      'ყოველი გაგზავნილი განაცხადი ინახება წევრობის განაცხადების რეესტრში რეფერენსის ნომრით, გაგზავნის თარიღით, არჩეული წევრობის ტიპით და მიმდინარე სტატუსით.',
    processSteps: [
      'შეავსეთ ორენოვანი ონლაინ რეგისტრაციის ფორმა და დაადასტურეთ სავალდებულო პუნქტები.',
      'გააგზავნეთ ფორმა, რათა განაცხადი პირდაპირ შეინახოს წევრობის რეესტრში.',
      'ფედერაცია განიხილავს განაცხადს და დაგიკავშირდებათ მითითებული საკონტაქტო მონაცემებით.',
    ],
    supportKicker: 'ოფიციალური ფორმის ჩამოტვირთვა',
    supportTitle: 'ოფიციალური დოკუმენტის გზა ცალკე ხელმისაწვდომია.',
    supportText:
      'აპლიკანტებს კვლავ შეუძლიათ ოფიციალური წევრობის განაცხადის ფორმის ჩამოტვირთვა და მისი ცალკე გაგზავნა, თუ დოკუმენტური პროცესი სჭირდებათ.',
    supportNote:
      'ონლაინ სისტემა და ჩამოსატვირთი ფორმა ერთსა და იმავე წევრობის გვერდზე პარალელურად რჩება ოფიციალური გამოყენებისთვის.',
    recordKicker: 'შენახული განაცხადის ჩანაწერი',
    recordTitle: 'ბოლო შენახული განაცხადი',
    recordText:
      'წარმატებული გაგზავნის შემდეგ აქ გამოჩნდება ბოლო შენახული განაცხადის რეფერენსი და მიმდინარე სტატუსი.',
    recordEmptyText: 'ამ სესიიდან ჯერ ონლაინ განაცხადი არ გაგზავნილა.',
    reviewNoteTitle: 'განხილვის შენიშვნა',
    reviewNoteText:
      'ონლაინ განაცხადები ფედერაციის განხილვის რიგში შედის. საბოლოო წევრობის დადასტურება კვლავ შიდა განხილვასა და დამტკიცებაზეა დამოკიდებული.',
    formKicker: 'აპლიკანტის მონაცემები',
    formTitle: 'წევრობის რეგისტრაციის ფორმა',
    formText: 'ფორმა სრულად შეავსეთ, რათა განაცხადი პირდაპირ ცოცხალ წევრობის რეესტრში გადაიგზავნოს.',
    groups: fieldGroups.ka,
    fields: fields.ka,
    consentTitle: 'სავალდებულო დადასტურებები',
    consentText: 'გაგზავნამდე მიიღეთ სამივე სავალდებულო დადასტურება.',
    consentItems: [
      'ვადასტურებ, რომ მოწოდებული ინფორმაცია სწორია.',
      'ვეთანხმები ფედერაციის წესებს და შიდა პროცედურებს.',
      'ვეთანხმები, რომ ფედერაცია დამიკავშირდეს ჩემს განაცხადთან დაკავშირებით.',
    ],
    validationTitle: 'რეგისტრაცია არ არის დასრულებული',
    validationText: 'გთხოვთ, შეავსოთ ყველა სავალდებულო ველი და დაადასტუროთ ყველა საჭირო პუნქტი.',
    submitSuccessTitle: 'განაცხადი გაგზავნილია',
    submitSuccessText:
      'თქვენი წევრობის განაცხადი ფედერაციის რეგისტრაციის სისტემაში შეინახა და მიენიჭა ცოცხალი რეფერენსის ნომერი.',
    submitSuccessHint:
      'ახლა ფედერაციას შეუძლია ჩანაწერის პირდაპირი განხილვა. საჭიროების შემთხვევაში, პარალელურად შეგიძლიათ გამოიყენოთ ჩამოსატვირთი ოფიციალური ფორმაც.',
    submitErrorTitle: 'გაგზავნა ვერ შესრულდა',
    submitErrorText:
      'ონლაინ რეგისტრაციის სისტემამ განაცხადის შენახვა ამ ეტაპზე ვერ შეძლო. სცადეთ ხელახლა ან დროებით გამოიყენეთ ჩამოსატვირთი წევრობის ფორმა.',
    resetLabel: 'ფორმის გასუფთავება',
    submitLabel: 'რეგისტრაციის გაგზავნა',
    summaryLabel: 'შენახული განაცხადის შეჯამება',
    referenceLabel: 'რეფერენსი',
    storedAtLabel: 'შენახვის დრო',
    downloadActionLabel: 'წევრობის ფორმის ჩამოტვირთვა',
    onlineOptionLabel: 'ონლაინ რეგისტრაცია',
    documentOptionLabel: 'ოფიციალური ჩამოსატვირთი ფორმა',
  },
}
