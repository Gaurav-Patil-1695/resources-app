exports.up = function (knex) {
  return knex.schema.createTable('order_tracking', (table) => {
    table.increments('id').primary();
    table.integer('order_id').unsigned().notNullable()
      .references('id').inTable('orders').onDelete('CASCADE');
    table.string('carrier', 100).nullable();
    table.string('tracking_number', 255).nullable();
    table.string('tracking_url', 500).nullable();
    table.string('current_location', 255).nullable();
    table.string('status', 100).notNullable();
    table.text('description').nullable();
    table.json('events').nullable();
    table.timestamp('estimated_delivery_at').nullable();
    table.timestamp('delivered_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.index(['order_id']);
    table.index(['tracking_number']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('order_tracking');
};
