FROM ruby:3.3.5

RUN apt-get update -qq && apt-get install -y \
  build-essential \
  libpq-dev \
  postgresql-client \
  nodejs \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY Gemfile Gemfile.lock ./
RUN gem install bundler && bundle install

COPY . .

COPY entrypoint.sh /usr/bin/entrypoint.sh
RUN chmod +x /usr/bin/entrypoint.sh

ENTRYPOINT ["entrypoint.sh"]

EXPOSE 3000

CMD ["bin/rails", "server", "-b", "0.0.0.0"]
