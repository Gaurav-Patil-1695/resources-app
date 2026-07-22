exports.up = function (knex) {
  return knex.schema.createTable('notifications', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().nullable()
      .references('id').inTable('users').onDelete('CASCADE');
    table.string('type', 100).notNullable();
    table.string('title', 255).notNullable();
    table.text('body').notNullable();
    table.json('data').nullable();
    table.enu('channel', ['in_app', 'email', 'sms', 'push'])
      .notNullable().defaultTo('in_app');
    table.boolean('is_read').notNullable().defaultTo(false);
    table.boolean('is_broadcast').notNullable().defaultTo(false);
    table.timestamp('read_at').nullable();
    table.timestamp('sent_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.index(['user_id']);
    table.index(['is_read']);
    table.index(['is_broadcast']);
    table.index(['type']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('notifications');
};
