exports.up = function (knex) {
  return knex.schema.createTable('brands', (table) => {
    table.increments('id').primary();
    table.string('name', 150).notNullable().unique();
    table.string('slug', 200).notNullable().unique();
    table.text('description').nullable();
    table.string('logo_url', 500).nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('brands');
};
