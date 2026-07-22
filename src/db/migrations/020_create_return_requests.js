exports.up = function (knex) {
  return knex.schema.createTable('return_requests', (table) => {
    table.increments('id').primary();
    table.integer('order_id').unsigned().notNullable()
      .references('id').inTable('orders').onDelete('RESTRICT');
    table.enu('status', [
      'requested',
      'approved',
      'rejected',
      'picked_up',
      'received',
      'refund_initiated',
      'completed'
    ]).notNullable().defaultTo('requested');
    table.text('reason').notNullable();
    table.text('customer_notes').nullable();
    table.text('admin_notes').nullable();
    table.json('item_details').nullable();
    table.string('pickup_address_id', 50).nullable();
    table.timestamp('requested_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('resolved_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.index(['order_id']);
    table.index(['status']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('return_requests');
};
