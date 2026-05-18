namespace app.Models.Admin;

public sealed record LocationPhotoAdminUpdateCommand(string? AltUk, bool? IsMain);

public sealed record LocationPhotoAdminUploadCommand(
    Stream Content,
    string FileName,
    string ContentType,
    long Length,
    string? AltUk,
    bool? IsMain);
