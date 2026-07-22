exports.up = function (knex) {
  return knex.schema.createTable('order_status_history', (table) => {
    table.increments('id').primary();
    table.integer('order_id').unsigned().notNullable()
      .references('id').inTable('orders').onDelete('CASCADE');
    table.string('status', 50).notNullable();
    table.string('previous_status', 50).nullable();
    table.text('comment').nullable();
    table.integer('changed_by').unsigned().nullable()
      .references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.index(['order_id']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('order_status_history');
};
