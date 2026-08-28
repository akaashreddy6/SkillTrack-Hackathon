-- Replace generic demo options without changing question identity, answers, or history.
do $$
declare
  question_row record;
  skill_name text;
begin
  for question_row in
    select q.id, q.topic, s.name
    from public.questions q
    join public.skills s on s.id = q.skill_id
  loop
    skill_name := question_row.name;
    if skill_name = 'JavaScript' then
      update public.questions set
        option_a = case question_row.topic
          when 'Variables' then 'A named binding that stores a value in JavaScript'
          when 'Functions' then 'A reusable block of JavaScript logic'
          when 'Arrays' then 'An ordered collection that can hold multiple values'
          when 'Async JavaScript' then 'Code that can continue while an operation is pending'
          when 'Promises' then 'An object representing a future asynchronous result'
          when 'DOM' then 'The browser document represented as a programmable object tree'
          when 'ES6' then 'A major JavaScript language update with modern syntax and features'
          when 'Objects' then 'A collection of keyed properties and values'
          when 'Events' then 'Signals that notify code that something happened'
          when 'Modules' then 'Files that expose and import reusable JavaScript code'
          else 'A JavaScript language concept used in application code' end,
        option_b = 'A CSS layout rule used only for visual styling',
        option_c = 'A SQL command that changes database records',
        option_d = 'A Java class member compiled by the Java runtime'
      where id = question_row.id;
    elsif skill_name = 'SQL' then
      update public.questions set
        option_a = case question_row.topic
          when 'Select' then 'Retrieves rows and columns from a database'
          when 'Filtering' then 'Restricts query results with a condition such as WHERE'
          when 'Joins' then 'Combines related rows from multiple tables'
          when 'Grouping' then 'Aggregates rows into groups for summary calculations'
          when 'Indexes' then 'A data structure that can speed up database lookups'
          when 'Constraints' then 'Rules that protect the validity of stored data'
          when 'Transactions' then 'A unit of work that can be committed or rolled back'
          when 'Subqueries' then 'A query nested inside another SQL statement'
          when 'Normalization' then 'Organizing tables to reduce unnecessary data duplication'
          when 'Security' then 'Controls and practices that protect database access and data'
          else 'A relational database concept used in SQL' end,
        option_b = 'A JavaScript function that updates browser styles',
        option_c = 'A React component property rendered by the browser',
        option_d = 'A Java class used to start an application server'
      where id = question_row.id;
    elsif skill_name = 'React' then
      update public.questions set
        option_a = case question_row.topic
          when 'Components' then 'A reusable unit of React UI and behavior'
          when 'Props' then 'Read-only values passed into a React component'
          when 'State' then 'Data owned by a component that can trigger a re-render'
          when 'Hooks' then 'Functions that let components use React features'
          when 'Effects' then 'Logic for synchronizing a component with external systems'
          when 'Forms' then 'An interface that collects and manages user input'
          when 'Keys' then 'Stable identifiers that help React track list items'
          when 'Context' then 'A way to share values across a component tree'
          when 'Performance' then 'Techniques that reduce unnecessary React rendering work'
          when 'Accessibility' then 'Practices that make React interfaces usable by more people'
          else 'A React concept used to build component-based interfaces' end,
        option_b = 'A SQL clause that filters rows in a database table',
        option_c = 'A JavaScript package that only defines CSS colors',
        option_d = 'A Java inheritance rule enforced by the JVM'
      where id = question_row.id;
    elsif skill_name = 'Java' then
      update public.questions set
        option_a = case question_row.topic
          when 'Classes' then 'A blueprint that defines Java objects and their behavior'
          when 'Inheritance' then 'A mechanism for deriving a class from another class'
          when 'Interfaces' then 'A contract that specifies methods a class can implement'
          when 'Collections' then 'Framework types for storing and processing groups of objects'
          when 'Exceptions' then 'Objects that represent and handle abnormal program conditions'
          when 'Generics' then 'Type parameters that make Java code safer to reuse'
          when 'Streams' then 'An API for processing sequences of data declaratively'
          when 'Threads' then 'Independent paths of execution within a Java program'
          when 'Encapsulation' then 'Keeping data and implementation details behind a class API'
          when 'Testing' then 'The practice of checking Java behavior against expected results'
          else 'A Java language or platform concept used in application development' end,
        option_b = 'A CSS property that changes the size of a web page',
        option_c = 'A SQL statement that deletes every database table',
        option_d = 'A React hook that manages browser navigation'
      where id = question_row.id;
    elsif skill_name = 'HTML' then
      update public.questions set
        option_a = case question_row.topic
          when 'Semantics' then 'Using elements whose names communicate the meaning of content'
          when 'Forms' then 'Markup that collects user input with controls and labels'
          when 'Accessibility' then 'HTML structure that supports users with different abilities'
          when 'Metadata' then 'Information in document head elements describing a page'
          when 'Tables' then 'Markup for presenting related data in rows and columns'
          when 'Media' then 'Elements that embed audio, video, or images in a page'
          when 'Structure' then 'The nested document hierarchy created by HTML elements'
          when 'ARIA' then 'Attributes that communicate interface roles and states to assistive technology'
          when 'Validation' then 'Checking markup against HTML rules and required constraints'
          when 'Performance' then 'Markup choices that help a browser load and render efficiently'
          else 'An HTML concept used to structure a web document' end,
        option_b = 'A JavaScript promise that resolves a network request',
        option_c = 'A SQL index used to optimize a database query',
        option_d = 'A Java class annotation processed by the compiler'
      where id = question_row.id;
    elsif skill_name = 'CSS' then
      update public.questions set
        option_a = case question_row.topic
          when 'Selectors' then 'Patterns that choose which HTML elements receive styles'
          when 'Box model' then 'The content, padding, border, and margin around an element'
          when 'Flexbox' then 'A one-dimensional layout system for arranging items'
          when 'Grid' then 'A two-dimensional layout system using rows and columns'
          when 'Responsive design' then 'Styles that adapt a layout to different screen sizes'
          when 'Specificity' then 'The precedence used when multiple CSS rules target an element'
          when 'Positioning' then 'Rules that control how an element is placed in a layout'
          when 'Typography' then 'Styles that control the appearance and spacing of text'
          when 'Animations' then 'Rules that transition or animate visual property values'
          when 'Accessibility' then 'Visual styling that keeps content usable and perceivable'
          else 'A CSS concept used to build a maintainable interface' end,
        option_b = 'A JavaScript array method that returns a new data set',
        option_c = 'A SQL transaction that commits database changes',
        option_d = 'A Java interface that defines object behavior'
      where id = question_row.id;
    elsif skill_name = 'Communication' then
      update public.questions set
        option_a = case question_row.topic
          when 'Listening' then 'Paying attention, clarifying, and accurately reflecting what was said'
          when 'Writing' then 'Structuring a message so its purpose and action are clear'
          when 'Presentation' then 'Explaining information to an audience with a clear narrative'
          when 'Feedback' then 'Specific, respectful information that supports improvement'
          when 'Collaboration' then 'Working transparently with others toward a shared outcome'
          when 'Clarity' then 'Communicating ideas in a precise and understandable way'
          when 'Planning' then 'Agreeing on goals, responsibilities, and next steps'
          when 'Conflict' then 'Addressing disagreement directly and constructively'
          when 'Stakeholders' then 'Adapting communication to people affected by the work'
          when 'Inclusive communication' then 'Communicating in ways that respect and include different perspectives'
          else 'A professional communication practice used in collaborative work' end,
        option_b = 'A database command that changes a table schema',
        option_c = 'A browser event listener that changes page layout',
        option_d = 'A Java compiler setting for memory allocation'
      where id = question_row.id;
    else
      update public.questions set
        option_a = 'A core ' || skill_name || ' concept used in practical work',
        option_b = 'A database operation unrelated to ' || skill_name,
        option_c = 'A browser styling rule unrelated to ' || skill_name,
        option_d = 'A programming language feature unrelated to ' || skill_name
      where id = question_row.id;
    end if;
  end loop;
end;
$$;