const downloadBase = `${import.meta.env.BASE_URL}downloads/`

const documentItems = [
  {
    id: 'charter',
    href: `${downloadBase}01_GDSFF_Wesdebis_Web_Version_Registered.docx`,
    fileName: '01_GDSFF_Wesdebis_Web_Version_Registered.docx',
  },
  {
    id: 'giorgi-bio',
    href: `${downloadBase}02_Giorgi_Gagnidze_Short_Bio_Final.docx`,
    fileName: '02_Giorgi_Gagnidze_Short_Bio_Final.docx',
  },
  {
    id: 'ana-bio',
    href: `${downloadBase}03_Ana_Fabchulidze_Short_Bio_Final.docx`,
    fileName: '03_Ana_Fabchulidze_Short_Bio_Final.docx',
  },
  {
    id: 'membership-form',
    href: `${downloadBase}04_GDSFF_Membership_Application_Form_Final.docx`,
    fileName: '04_GDSFF_Membership_Application_Form_Final.docx',
  },
  {
    id: 'content-pack',
    href: `${downloadBase}05_GDSFF_Website_Content_Pack_Final.docx`,
    fileName: '05_GDSFF_Website_Content_Pack_Final.docx',
  },
  {
    id: 'upload-checklist',
    href: `${downloadBase}06_GDSFF_Website_Upload_Checklist_Final.docx`,
    fileName: '06_GDSFF_Website_Upload_Checklist_Final.docx',
  },
  {
    id: 'logo',
    href: `${downloadBase}08_GDSFF_Official_Logo_Approved.png`,
    fileName: '08_GDSFF_Official_Logo_Approved.png',
  },
]

export const officialLaunchContent = {
  en: {
    about: {
      eyebrow: 'About',
      title: 'Federation Overview and Charter',
      text:
        'Official federation profile, mission, charter basis, and institutional role presented in one clear reference format.',
      highlights: ['Registered federation', 'Modern sport platform', 'International cooperation'],
      overviewTitle: 'Federation Overview',
      overviewParagraphs: [
        'Georgian Dynamic Shooting & Functional Fitness Federation is a registered sports federation dedicated to the development of dynamic shooting and functional fitness in Georgia, athlete support, competition organization, institutional strengthening, and the expansion of international cooperation.',
      ],
      missionTitle: 'Mission',
      missionText:
        'The federation mission is to establish in Georgia a modern, disciplined, high-standard sports platform that supports the development of dynamic shooting and functional fitness, athlete progression, the culture of safety, and the worthy representation of Georgia within the international sports environment.',
      visionTitle: 'Vision',
      visionText:
        'The federation vision is for Georgia to become a regional hub for dynamic shooting, functional fitness, international competitions, training programs, and sports tourism.',
      legalTitle: 'Institutional Status',
      legalText:
        'The federation operates as a registered organization within the relevant legal and organizational framework.',
      charterTitle: 'Charter',
      charterParagraphs: [
        'The federation charter is the core internal regulatory document of the organization and defines the federation objectives, governance structure, membership basis, main activity directions, and internal administrative principles.',
        'The charter reflects the legal and organizational foundations of federation activity and serves as the official document regulating organizational functioning, member participation, and governance principles.',
      ],
    },
    leadership: {
      eyebrow: 'Leadership',
      title: 'President and Director',
      text:
        'Federation leadership supports strategic development, administrative management, partner coordination, and structured sport development.',
      highlights: ['Strategic leadership', 'Administrative coordination', 'Institutional representation'],
      introTitle: 'Leadership',
      introText:
        'Federation leadership ensures the strategic development of the organization, administrative management, partner cooperation, and the organized development of sport directions.',
      profiles: [
        {
          id: 'president',
          role: 'President',
          name: 'Giorgi Gagnidze',
          text:
            'Giorgi Gagnidze is the President of the Georgian Dynamic Shooting & Functional Fitness Federation. He leads the strategic development of the federation, the process of institutional positioning, the deepening of partner relations, and the implementation of long-term federation goals. His role includes strengthening the organizational framework, developing sport directions, supporting international cooperation, and representing the federation in relevant professional and institutional environments.',
          href: `${downloadBase}02_Giorgi_Gagnidze_Short_Bio_Final.docx`,
          actionLabel: 'Download Bio',
        },
        {
          id: 'director',
          role: 'Director',
          name: 'Ana Fabchulidze',
          text:
            'Ana Fabchulidze is the Director of the Georgian Dynamic Shooting & Functional Fitness Federation. She is responsible for administrative coordination, management of organizational processes, internal communication, and the effective execution of ongoing activity. Her work supports the stability of daily federation operations, the systematic development of organizational processes, and the practical delivery of federation programs.',
          href: `${downloadBase}03_Ana_Fabchulidze_Short_Bio_Final.docx`,
          actionLabel: 'Download Bio',
        },
      ],
    },
    membership: {
      eyebrow: 'Membership',
      title: 'Join the Federation',
      text:
        'Membership is open to individuals, athletes, coaches, clubs, and other relevant entities in accordance with the federation charter and internal requirements.',
      highlights: ['Individuals and clubs', 'Charter-based process', 'Official email submission'],
      paragraphs: [
        'The federation welcomes the involvement of individuals and organizations that share the federation goals, ethical standards, and development-oriented vision.',
        'An applicant must download the membership application form, complete it in full, and send it to the official federation email address.',
        'Completed applications are accepted electronically at: office@gdsff.org',
      ],
      applicationTitle: 'Membership Application Form',
      applicationText:
        'Download the official application form and submit the completed version to the federation email address.',
      applicationHref: `${downloadBase}04_GDSFF_Membership_Application_Form_Final.docx`,
      actionLabel: 'Download Application Form',
    },
    documents: {
      eyebrow: 'Documents',
      title: 'Official Documents and Downloads',
      text:
        'This page gathers the main official federation documents, forms, and reference materials available for download.',
      highlights: ['Official files', 'Federation records', 'Direct downloads'],
      introTitle: 'Official Documents',
      introText:
        'The document library includes the charter, leadership biographies, membership form, public logo file, content pack, and upload checklist.',
      items: [
        {
          ...documentItems[0],
          title: 'Federation Charter',
          description: 'Registered web-version charter prepared for official federation use.',
          actionLabel: 'Download Charter',
        },
        {
          ...documentItems[1],
          title: 'Giorgi Gagnidze Short Bio',
          description: 'Official short biography for the federation president.',
          actionLabel: 'Download Bio',
        },
        {
          ...documentItems[2],
          title: 'Ana Fabchulidze Short Bio',
          description: 'Official short biography for the federation director.',
          actionLabel: 'Download Bio',
        },
        {
          ...documentItems[3],
          title: 'Membership Application Form',
          description: 'Official federation membership application form for new applicants.',
          actionLabel: 'Download Form',
        },
        {
          ...documentItems[4],
          title: 'Website Content Pack',
          description: 'Launch website content pack prepared for official federation use.',
          actionLabel: 'Download Pack',
        },
        {
          ...documentItems[5],
          title: 'Website Upload Checklist',
          description: 'Launch checklist used to verify final website deployment readiness.',
          actionLabel: 'Download Checklist',
        },
        {
          ...documentItems[6],
          title: 'Official GDSFF Logo',
          description: 'Approved public federation logo file for media, partner decks, and official references.',
          actionLabel: 'Download Logo',
          format: 'PNG',
        },
      ],
    },
    home: {
      leadershipEyebrow: 'Leadership Preview',
      leadershipTitle: 'Official leadership presented with direct access to the president and director profiles.',
      leadershipText:
        'The homepage surfaces the leadership profile area so institutions, partners, and members can quickly understand responsibility and coordination.',
      membershipEyebrow: 'Membership Preview',
      membershipTitle: 'A clear application path for individuals, athletes, coaches, and clubs.',
      membershipText:
        'Membership entry is structured through a formal application form and direct submission to the official federation email address.',
      membershipActionLabel: 'Open Membership',
      documentsEyebrow: 'Documents Preview',
      documentsTitle: 'Essential federation documents available from one official download center.',
      documentsText:
        'The documents preview highlights the files most relevant for federation administration and stakeholder communication.',
      documentsActionLabel: 'Open Documents',
    },
  },
  ka: {
    about: {
      eyebrow: 'ფედერაციის შესახებ',
      title: 'ფედერაციის შესახებ და წესდება',
      text:
        'ფედერაციის ოფიციალური პროფილი, მისია, ხედვა, წესდების საფუძველი და ინსტიტუციური სტატუსი წარმოდგენილია ერთ სუფთა ოფიციალურ ფორმატში.',
      highlights: ['რეგისტრირებული ფედერაცია', 'თანამედროვე სპორტული პლატფორმა', 'საერთაშორისო თანამშრომლობა'],
      overviewTitle: 'ფედერაციის შესახებ',
      overviewParagraphs: [
        'Georgian Dynamic Shooting & Functional Fitness Federation არის რეგისტრირებული სპორტული ფედერაცია, რომელიც მიზნად ისახავს საქართველოში დინამიური სროლისა და ფუნქციური ფიტნესის განვითარებას, სპორტსმენების მხარდაჭერას, შეჯიბრებების ორგანიზებას, ინსტიტუციურ გაძლიერებასა და საერთაშორისო თანამშრომლობის გაფართოებას.',
      ],
      missionTitle: 'მისია',
      missionText:
        'ფედერაციის მისიაა საქართველოში ჩამოაყალიბოს თანამედროვე, დისციპლინირებული და მაღალი სტანდარტების სპორტული პლატფორმა, რომელიც უზრუნველყოფს დინამიური სროლისა და ფუნქციური ფიტნესის განვითარებას, სპორტსმენთა წინსვლას, უსაფრთხოების კულტურის დამკვიდრებას და საერთაშორისო სპორტულ სივრცეში საქართველოს ღირსეულ წარმოდგენას.',
      visionTitle: 'ხედვა',
      visionText:
        'ფედერაციის ხედვაა საქართველო ჩამოყალიბდეს რეგიონულ ჰაბად დინამიური სროლის, ფუნქციური ფიტნესის, საერთაშორისო შეჯიბრებების, საწვრთნელი პროგრამებისა და სპორტული ტურიზმის მიმართულებით.',
      legalTitle: 'ინსტიტუციური სტატუსი',
      legalText:
        'ფედერაცია მოქმედებს როგორც რეგისტრირებული ორგანიზაცია, შესაბამისი სამართლებრივი და ორგანიზაციული ჩარჩოს ფარგლებში.',
      charterTitle: 'წესდება',
      charterParagraphs: [
        'ფედერაციის წესდება წარმოადგენს ორგანიზაციის ძირითად შიდა მარეგულირებელ დოკუმენტს, რომელიც განსაზღვრავს ფედერაციის მიზნებს, მმართველობით სტრუქტურას, წევრობის საფუძვლებს, საქმიანობის ძირითად მიმართულებებსა და შიდა ადმინისტრაციულ პრინციპებს.',
        'წესდება ასახავს ფედერაციის საქმიანობის სამართლებრივ და ორგანიზაციულ საფუძვლებს და წარმოადგენს ოფიციალურ დოკუმენტს, რომელიც არეგულირებს ორგანიზაციის ფუნქციონირებას, წევრთა მონაწილეობას და მმართველობის პრინციპებს.',
      ],
    },
    leadership: {
      eyebrow: 'ხელმძღვანელობა',
      title: 'პრეზიდენტი და დირექტორი',
      text:
        'ფედერაციის ხელმძღვანელობა უზრუნველყოფს ორგანიზაციის სტრატეგიულ განვითარებას, ადმინისტრაციულ მართვას, პარტნიორულ თანამშრომლობასა და სპორტული მიმართულებების ორგანიზებულ განვითარებას.',
      highlights: ['სტრატეგიული მართვა', 'ადმინისტრაციული კოორდინაცია', 'ინსტიტუციური წარმომადგენლობა'],
      introTitle: 'ხელმძღვანელობა',
      introText:
        'ფედერაციის ხელმძღვანელობა უზრუნველყოფს ორგანიზაციის სტრატეგიულ განვითარებას, ადმინისტრაციულ მართვას, პარტნიორულ თანამშრომლობასა და სპორტული მიმართულებების ორგანიზებულ განვითარებას.',
      profiles: [
        {
          id: 'president',
          role: 'პრეზიდენტი',
          name: 'გიორგი გაგნიძე',
          text:
            'გიორგი გაგნიძე არის Georgian Dynamic Shooting & Functional Fitness Federation-ის პრეზიდენტი. იგი ხელმძღვანელობს ფედერაციის სტრატეგიულ განვითარებას, ინსტიტუციური პოზიციონირების პროცესს, პარტნიორული ურთიერთობების გაღრმავებასა და ფედერაციის გრძელვადიანი მიზნების განხორციელებას. მისი როლი მოიცავს ორგანიზაციული ჩარჩოს განმტკიცებას, სპორტული მიმართულებების განვითარებას, საერთაშორისო თანამშრომლობის ხელშეწყობასა და ფედერაციის წარმომადგენლობას შესაბამის პროფესიულ და ინსტიტუციურ სივრცეებში.',
          href: `${downloadBase}02_Giorgi_Gagnidze_Short_Bio_Final.docx`,
          actionLabel: 'ბიოს ჩამოტვირთვა',
        },
        {
          id: 'director',
          role: 'დირექტორი',
          name: 'ანა ფაბჩულიძე',
          text:
            'ანა ფაბჩულიძე არის Georgian Dynamic Shooting & Functional Fitness Federation-ის დირექტორი. იგი პასუხისმგებელია ფედერაციის ადმინისტრაციულ კოორდინაციაზე, საორგანიზაციო პროცესების მართვაზე, შიდა კომუნიკაციის გამართულობაზე და მიმდინარე საქმიანობის ეფექტიან შესრულებაზე. მისი საქმიანობა ხელს უწყობს ფედერაციის ყოველდღიური ოპერაციების სტაბილურობას, ორგანიზაციული პროცესების სისტემურ განვითარებასა და პროგრამების განხორციელების პრაქტიკულ უზრუნველყოფას.',
          href: `${downloadBase}03_Ana_Fabchulidze_Short_Bio_Final.docx`,
          actionLabel: 'ბიოს ჩამოტვირთვა',
        },
      ],
    },
    membership: {
      eyebrow: 'გაწევრიანება',
      title: 'გაწევრიანება',
      text:
        'ფედერაციაში გაწევრიანება შესაძლებელია ფიზიკური პირების, სპორტსმენების, მწვრთნელების, კლუბების და სხვა შესაბამისი სუბიექტებისათვის, ფედერაციის წესდებისა და შიდა მოთხოვნების შესაბამისად.',
      highlights: ['ფიზიკური პირები და კლუბები', 'წესდებაზე დაფუძნებული პროცესი', 'ოფიციალური ელფოსტა'],
      paragraphs: [
        'ფედერაცია მიესალმება იმ პირებისა და ორგანიზაციების ჩართვას, რომლებიც იზიარებენ ფედერაციის მიზნებს, ეთიკურ სტანდარტებსა და განვითარებაზე ორიენტირებულ ხედვას.',
        'გაწევრიანების მსურველმა პირმა ან ორგანიზაციამ უნდა ჩამოტვირთოს წევრობის განაცხადის ფორმა, შეავსოს სრულად და გადმოაგზავნოს ფედერაციის ოფიციალურ ელფოსტაზე.',
        'შევსებული განაცხადები მიიღება ელექტრონულად შემდეგ მისამართზე: office@gdsff.org',
      ],
      applicationTitle: 'წევრობის განაცხადის ფორმა',
      applicationText:
        'ჩამოტვირთეთ ოფიციალური განაცხადის ფორმა, შეავსეთ სრულად და გადმოაგზავნეთ ფედერაციის ელფოსტაზე.',
      applicationHref: `${downloadBase}04_GDSFF_Membership_Application_Form_Final.docx`,
      actionLabel: 'განაცხადის ფორმის ჩამოტვირთვა',
    },
    documents: {
      eyebrow: 'დოკუმენტები',
      title: 'ოფიციალური დოკუმენტები და ჩამოტვირთვები',
      text:
        'ამ გვერდზე თავმოყრილია ფედერაციის ძირითადი ოფიციალური დოკუმენტები, ფორმები და საინფორმაციო მასალები, რომლებიც ხელმისაწვდომია ჩამოტვირთვისთვის.',
      highlights: ['ოფიციალური ფაილები', 'საიტის გაშვების მასალები', 'პირდაპირი ჩამოტვირთვა'],
      introTitle: 'ოფიციალური დოკუმენტები',
      introText:
        'დოკუმენტების ბიბლიოთეკა აერთიანებს წესდებას, ხელმძღვანელობის ბიოგრაფიებს, წევრობის ფორმას, საჯარო ლოგოს ფაილს, საიტის კონტენტის პაკეტს და ატვირთვის შემოწმების სიას.',
      items: [
        {
          ...documentItems[0],
          title: 'ფედერაციის წესდება',
          description: 'რეგისტრირებული ვებ-ვერსიის წესდება ოფიციალური გამოყენებისთვის.',
          actionLabel: 'წესდების ჩამოტვირთვა',
        },
        {
          ...documentItems[1],
          title: 'გიორგი გაგნიძის მოკლე ბიოგრაფია',
          description: 'ფედერაციის პრეზიდენტის ოფიციალური მოკლე ბიოგრაფია.',
          actionLabel: 'ბიოს ჩამოტვირთვა',
        },
        {
          ...documentItems[2],
          title: 'ანა ფაბჩულიძის მოკლე ბიოგრაფია',
          description: 'ფედერაციის დირექტორის ოფიციალური მოკლე ბიოგრაფია.',
          actionLabel: 'ბიოს ჩამოტვირთვა',
        },
        {
          ...documentItems[3],
          title: 'წევრობის განაცხადის ფორმა',
          description: 'ფედერაციის ოფიციალური განაცხადის ფორმა გაწევრიანების მსურველთათვის.',
          actionLabel: 'ფორმის ჩამოტვირთვა',
        },
        {
          ...documentItems[4],
          title: 'ვებ-კონტენტის პაკეტი',
          description: 'საიტის ოფიციალური კონტენტის პაკეტი გაშვებისთვის.',
          actionLabel: 'პაკეტის ჩამოტვირთვა',
        },
        {
          ...documentItems[5],
          title: 'საიტის ატვირთვის შემოწმების სია',
          description: 'გაშვებამდე საბოლოო შემოწმების დოკუმენტი.',
          actionLabel: 'ჩეკლისტის ჩამოტვირთვა',
        },
        {
          ...documentItems[6],
          title: 'GDSFF-ის ოფიციალური ლოგო',
          description: 'დამტკიცებული საჯარო ფედერაციული ლოგოს ფაილი მედიისთვის, პარტნიორული მასალებისთვის და ოფიციალური გამოყენებისთვის.',
          actionLabel: 'ლოგოს ჩამოტვირთვა',
          format: 'PNG',
        },
      ],
    },
    home: {
      leadershipEyebrow: 'ხელმძღვანელობის მიმოხილვა',
      leadershipTitle: 'ოფიციალური ხელმძღვანელობის ბლოკი პრეზიდენტისა და დირექტორის პროფილებით.',
      leadershipText:
        'მთავარ გვერდზე წარმოდგენილია ძირითადი ხელმძღვანელობის პროფილები, რათა ინსტიტუციებმა, პარტნიორებმა და წევრებმა სწრაფად მიიღონ საჭირო ორიენტაცია.',
      membershipEyebrow: 'გაწევრიანების მიმოხილვა',
      membershipTitle: 'გაწევრიანების მკაფიო პროცესი ფიზიკური პირების, სპორტსმენების, მწვრთნელებისა და კლუბებისთვის.',
      membershipText:
        'გაწევრიანება დაფუძნებულია ოფიციალურ განაცხადის ფორმაზე და სრულ განაცხადთა გაგზავნაზე ფედერაციის ოფიციალურ ელფოსტაზე.',
      membershipActionLabel: 'გაწევრიანების გვერდი',
      documentsEyebrow: 'დოკუმენტების მიმოხილვა',
      documentsTitle: 'საიტის მთავარი ოფიციალური დოკუმენტები ხელმისაწვდომია ერთ სივრცეში.',
      documentsText:
        'დოკუმენტების ბლოკი აერთიანებს გაშვებისთვის მნიშვნელოვან ფედერაციულ ფაილებსა და ჩამოსატვირთ მასალებს.',
      documentsActionLabel: 'დოკუმენტების გვერდი',
    },
  },
}
