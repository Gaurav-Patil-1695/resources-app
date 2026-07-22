exports.up = function (knex) {
  return knex.schema.createTable('categories', (table) => {
    table.increments('id').primary();
    table.string('name', 150).notNullable();
    table.string('slug', 200).notNullable().unique();
    table.text('description').nullable();
    table.string('image_url', 500).nullable();
    table.integer('parent_id').unsigned().nullable()
      .references('id').inTable('categories').onDelete('SET NULL');
    table.integer('sort_order').notNullable().defaultTo(0);
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('categories');
};
