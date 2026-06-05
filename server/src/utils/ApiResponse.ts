export class ApiResponse<T> {
  constructor(
    public data: T,
    public message = "Success"
  ) {}
}
